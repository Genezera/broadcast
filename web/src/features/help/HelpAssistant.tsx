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
import { useI18n } from "../../i18n/I18nProvider";
import {
  FAQ,
  getNode,
  ROOT_ID,
  topicForSection,
  type HelpNode,
} from "./helpContent";

type Option = { id: string; label: string; highlight?: boolean };

/**
 * A conversa guarda só ids de tópicos, nunca o texto. Assim ela é montada na
 * hora no idioma atual e acompanha a troca de idioma sem recomeçar.
 */
type Entry =
  | { id: number; from: "user"; topic: string }
  | {
      id: number;
      from: "bot";
      topic: string;
      /** Primeira mensagem: guarda o assunto da tela em que a ajuda abriu. */
      greeting?: { contextTopic: string | null };
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

let entryId = 0;
const nextId = () => ++entryId;

const greetingEntry = (contextTopic: string | null): Entry => ({
  id: nextId(),
  from: "bot",
  topic: ROOT_ID,
  greeting: { contextTopic },
});

function BotBubble({ node, intro }: { node: HelpNode; intro?: string }) {
  const text = intro ?? node.intro;
  return (
    <div className="animate-pop max-w-[92%] rounded-2xl rounded-tl-md bg-surface-muted px-4 py-3 text-sm leading-relaxed">
      {text && <p className="font-semibold">{text}</p>}
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

function TypingBubble({ label }: { label: string }) {
  return (
    <div
      className="animate-pop flex w-fit gap-1.5 rounded-2xl rounded-tl-md bg-surface-muted px-4 py-3.5"
      role="status"
      aria-label={label}
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
  const { t, lang } = useI18n();
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

  const optionsFor = (node: HelpNode): Option[] => {
    const options = node.next.flatMap((id) => {
      const target = getNode(lang, id);
      return target ? [{ id, label: target.label }] : [];
    });
    return node.id === ROOT_ID
      ? options
      : [...options, { id: ROOT_ID, label: t("help.mainMenu") }];
  };

  /** Botões da primeira mensagem, com o assunto da tela em destaque. */
  const greetingOptions = (node: HelpNode, context: string | null) => {
    const options = optionsFor(node);
    const target = context ? getNode(lang, context) : undefined;
    if (!target) return options;
    return [
      {
        id: target.id,
        label: t("help.thisScreen", { topic: target.label }),
        highlight: true,
      },
      ...options.filter((option) => option.id !== target.id),
    ];
  };

  const reset = () => {
    clearTimeout(timer.current);
    setTyping(false);
    setEntries([greetingEntry(contextTopic)]);
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
    if (entries.length === 0) setEntries([greetingEntry(contextTopic)]);
  };

  const pick = (option: Option) => {
    if (!getNode(lang, option.id) || typing) return;
    setEntries((current) => [
      ...current,
      { id: nextId(), from: "user", topic: option.id },
    ]);
    setTyping(true);
    timer.current = setTimeout(
      () => {
        setEntries((current) => [
          ...current,
          { id: nextId(), from: "bot", topic: option.id },
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
        <Tooltip title={t("help.fabTooltip")} placement="left">
          <Fab
            color="primary"
            variant="extended"
            aria-label={t("help.open")}
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
            <span className="hidden sm:inline">{t("help.fab")}</span>
          </Fab>
        </Tooltip>
      )}

      <Drawer
        anchor={isPhone ? "bottom" : "right"}
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            "aria-label": t("help.panelTitle"),
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
            <p className="font-display font-extrabold">
              {t("help.panelTitle")}
            </p>
            <p className="text-xs text-muted">{t("help.panelSubtitle")}</p>
          </div>
          {tab === "bot" && (
            <Tooltip title={t("help.restart")}>
              <IconButton
                size="small"
                aria-label={t("help.restart")}
                onClick={reset}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            size="small"
            aria-label={t("help.close")}
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
          <Tab
            value="bot"
            label={t("help.tabAssistant")}
            sx={{ minHeight: 44 }}
          />
          <Tab value="faq" label={t("help.tabFaq")} sx={{ minHeight: 44 }} />
        </Tabs>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {tab === "bot" ? (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => {
                const node = getNode(lang, entry.topic);
                if (!node) return null;
                if (entry.from === "user") {
                  return (
                    <div
                      key={entry.id}
                      className="animate-pop ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      {node.label}
                    </div>
                  );
                }
                return (
                  <div key={entry.id} className="flex flex-col gap-2">
                    <BotBubble
                      node={
                        entry.greeting ? { ...node, intro: undefined } : node
                      }
                      intro={entry.greeting ? t("help.greeting") : undefined}
                    />
                    {node.action && entry === lastBot && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                        onClick={() => {
                          setOpen(false);
                          navigate(node.action!.to);
                        }}
                      >
                        {node.action.label}
                      </Button>
                    )}
                  </div>
                );
              })}
              {typing && <TypingBubble label={t("help.typing")} />}
              {!typing &&
                lastBot &&
                (() => {
                  const node = getNode(lang, lastBot.topic);
                  if (!node) return null;
                  const options = lastBot.greeting
                    ? greetingOptions(node, lastBot.greeting.contextTopic)
                    : optionsFor(node);
                  return (
                    <div
                      className="mt-1 flex flex-wrap gap-2"
                      aria-label={t("help.options")}
                    >
                      {options.map((option, index) => (
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
                  );
                })()}
              <div ref={bottom} />
            </div>
          ) : (
            <div className="animate-fade">
              {FAQ[lang].map((item) => (
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
