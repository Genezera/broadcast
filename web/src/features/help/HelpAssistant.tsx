import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Drawer,
  Fab,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { sectionFromPath } from "../../components/layout/navigation";
import {
  FAQ,
  getNode,
  ROOT_ID,
  topicForSection,
  type HelpNode,
} from "./helpContent";

type Option = { id: string; label: string; highlight?: boolean };
type Entry =
  | { id: number; from: "user"; text: string }
  | {
      id: number;
      from: "bot";
      node: HelpNode;
      intro?: string;
      options: Option[];
    };

/** Tempo do "digitando..." antes de cada resposta (zero sem animações). */
const TYPING_MS = 650;
const SEEN_KEY = "broadcast:help-seen";

const prefersReducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

const optionsFor = (node: HelpNode): Option[] => {
  const options = node.next.flatMap((id) => {
    const target = getNode(id);
    return target ? [{ id, label: target.label }] : [];
  });
  return node.id === ROOT_ID
    ? options
    : [...options, { id: ROOT_ID, label: "Menu principal" }];
};

let entryId = 0;
const nextId = () => ++entryId;

/** Primeira mensagem: oferece, em destaque, o assunto da tela atual. */
const greeting = (contextTopic: string | null): Entry => {
  const root = getNode(ROOT_ID)!;
  const context = contextTopic ? getNode(contextTopic) : undefined;
  const options = optionsFor(root);
  return {
    id: nextId(),
    from: "bot",
    node: { ...root, intro: undefined },
    intro:
      "Olá! Eu sou o assistente do Broadcast. É só tocar nos botões, não precisa digitar.",
    options: context
      ? [
          {
            id: context.id,
            label: `Esta tela: ${context.label}`,
            highlight: true,
          },
          ...options.filter((option) => option.id !== context.id),
        ]
      : options,
  };
};

function BotBubble({ entry }: { entry: Extract<Entry, { from: "bot" }> }) {
  const { node } = entry;
  const intro = entry.intro ?? node.intro;
  return (
    <div className="animate-pop max-w-[92%] rounded-2xl rounded-tl-md bg-surface-muted px-4 py-3 text-sm leading-relaxed">
      {intro && <p className="font-semibold">{intro}</p>}
      {node.steps && (
        <ol className="mt-2 space-y-2">
          {node.steps.map((step, index) => (
            <li key={step} className="flex gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
      {node.tips?.map((tip) => (
        <p
          key={tip}
          className="mt-2.5 flex gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning"
        >
          <LightbulbOutlinedIcon sx={{ fontSize: 17, mt: "1px" }} />
          <span>{tip}</span>
        </p>
      ))}
    </div>
  );
}

function TypingBubble() {
  return (
    <div
      className="animate-pop flex w-fit gap-1.5 rounded-2xl rounded-tl-md bg-surface-muted px-4 py-3.5"
      role="status"
      aria-label="Assistente digitando"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="typing-dot h-2 w-2 rounded-full bg-muted"
          style={{ animationDelay: `${dot * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export function HelpAssistant() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isPhone = useMediaQuery("(max-width: 599px)");
  const contextTopic = topicForSection(sectionFromPath(pathname));

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"bot" | "faq">("bot");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [typing, setTyping] = useState(false);
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return true;
    }
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Mantém a última mensagem visível conforme a conversa cresce.
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [entries, typing, open, tab]);

  const reset = () => {
    clearTimeout(timer.current);
    setTyping(false);
    setEntries([greeting(contextTopic)]);
  };

  const openPanel = () => {
    setOpen(true);
    if (!seen) {
      setSeen(true);
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Sem persistência: o destaque do botão só volta numa nova sessão.
      }
    }
    // A primeira abertura cria a conversa já com o assunto da tela atual.
    if (entries.length === 0) setEntries([greeting(contextTopic)]);
  };

  const pick = (option: Option) => {
    const node = getNode(option.id);
    if (!node || typing) return;
    const label = option.highlight
      ? node.label
      : option.id === ROOT_ID
        ? "Menu principal"
        : option.label;
    setEntries((current) => [
      ...current,
      { id: nextId(), from: "user", text: label },
    ]);
    setTyping(true);
    timer.current = setTimeout(
      () => {
        setEntries((current) => [
          ...current,
          { id: nextId(), from: "bot", node, options: optionsFor(node) },
        ]);
        setTyping(false);
      },
      prefersReducedMotion() ? 0 : TYPING_MS,
    );
  };

  const lastBot = [...entries].reverse().find((entry) => entry.from === "bot");

  return (
    <>
      {!open && (
        <Tooltip title="Precisa de ajuda?" placement="left">
          <Fab
            color="primary"
            variant="extended"
            aria-label="Abrir ajuda"
            onClick={openPanel}
            className={`animate-pop ${seen ? "" : "help-ring"}`}
            sx={{
              position: "fixed",
              right: { xs: 16, md: 24 },
              bottom: { xs: 88, md: 24 },
              zIndex: 1200,
              gap: 1,
              px: { xs: 2, sm: 2.5 },
              boxShadow: "0 10px 28px rgba(101, 86, 235, 0.4)",
            }}
          >
            <HelpOutlineIcon />
            <span className="hidden sm:inline">Ajuda</span>
          </Fab>
        </Tooltip>
      )}

      <Drawer
        anchor={isPhone ? "bottom" : "right"}
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            "aria-label": "Assistente de ajuda",
            sx: {
              width: { xs: "100%", sm: 420 },
              height: { xs: "88vh", sm: "100%" },
              borderTopLeftRadius: { xs: 20, sm: 20 },
              borderTopRightRadius: { xs: 20, sm: 0 },
              borderBottomLeftRadius: { xs: 0, sm: 20 },
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand">
            <SmartToyOutlinedIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold">Assistente de ajuda</p>
            <p className="text-xs text-muted">Respostas rápidas por botões</p>
          </div>
          {tab === "bot" && (
            <Tooltip title="Recomeçar conversa">
              <IconButton
                size="small"
                aria-label="Recomeçar conversa"
                onClick={reset}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            size="small"
            aria-label="Fechar ajuda"
            onClick={() => setOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </header>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider", minHeight: 44 }}
        >
          <Tab value="bot" label="Assistente" sx={{ minHeight: 44 }} />
          <Tab
            value="faq"
            label="Perguntas frequentes"
            sx={{ minHeight: 44 }}
          />
        </Tabs>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {tab === "bot" ? (
            <div className="flex flex-col gap-3">
              {entries.map((entry) =>
                entry.from === "user" ? (
                  <div
                    key={entry.id}
                    className="animate-pop ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    {entry.text}
                  </div>
                ) : (
                  <div key={entry.id} className="flex flex-col gap-2">
                    <BotBubble entry={entry} />
                    {entry.node.action && entry === lastBot && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                        onClick={() => {
                          setOpen(false);
                          navigate(entry.node.action!.to);
                        }}
                      >
                        {entry.node.action.label}
                      </Button>
                    )}
                  </div>
                ),
              )}
              {typing && <TypingBubble />}
              {!typing && lastBot && lastBot.from === "bot" && (
                <div className="mt-1 flex flex-wrap gap-2" aria-label="Opções">
                  {lastBot.options.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      color={option.highlight ? "primary" : "default"}
                      variant={option.highlight ? "filled" : "outlined"}
                      onClick={() => pick(option)}
                      className="animate-item"
                      style={{ ["--i" as string]: index }}
                      sx={{ height: 34, fontSize: 13 }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottom} />
            </div>
          ) : (
            <div className="animate-fade">
              {FAQ.map((item) => (
                <Accordion
                  key={item.question}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: "12px !important",
                    mb: 1.25,
                    "&::before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <span className="text-sm font-bold">{item.question}</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <p className="text-sm leading-relaxed text-subtle">
                      {item.answer}
                    </p>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
