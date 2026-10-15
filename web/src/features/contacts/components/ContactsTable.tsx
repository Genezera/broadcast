import { Avatar, IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Flag } from "../../../components/ui/Flag";
import { formatDateTime } from "../../../lib/dates";
import { displayPhone, phoneCountry } from "../../../lib/phone";
import type { Contact } from "../../../types";

type ContactsTableProps = {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
};

function PhoneCell({ phone }: { phone: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Flag country={phoneCountry(phone)} />
      {displayPhone(phone)}
    </span>
  );
}

function RowActions({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}) {
  return (
    <>
      <Tooltip title="Editar">
        <IconButton
          size="small"
          aria-label={`Editar ${contact.name}`}
          onClick={() => onEdit(contact)}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Excluir">
        <IconButton
          size="small"
          color="error"
          aria-label={`Excluir ${contact.name}`}
          onClick={() => onDelete(contact)}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}

/**
 * Tablet e desktop: tabela. Celular: lista de cards, que não exige rolagem
 * horizontal e deixa os botões de ação num alvo de toque confortável.
 */
export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-6 py-4 font-bold">Nome</th>
              <th className="px-6 py-4 font-bold">Telefone</th>
              <th className="hidden px-6 py-4 font-bold lg:table-cell">
                Cadastro
              </th>
              <th className="px-6 py-4 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, index) => (
              <tr
                key={contact.id}
                className="animate-row border-t border-line transition-colors hover:bg-surface-hover"
                style={{ ["--i" as string]: index }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="avatar-brand">
                      {contact.name[0]?.toUpperCase()}
                    </Avatar>
                    <span className="font-bold">{contact.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-subtle">
                  <PhoneCell phone={contact.phone} />
                </td>
                <td className="hidden px-6 py-4 text-sm text-muted lg:table-cell">
                  {formatDateTime(contact.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <RowActions
                    contact={contact}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {contacts.map((contact, index) => (
          <li
            key={contact.id}
            className="animate-row flex items-center gap-3 px-4 py-3"
            style={{ ["--i" as string]: index }}
          >
            <Avatar className="avatar-brand">
              {contact.name[0]?.toUpperCase()}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{contact.name}</p>
              <p className="truncate text-sm text-subtle">
                <PhoneCell phone={contact.phone} />
              </p>
            </div>
            <div className="flex shrink-0">
              <RowActions
                contact={contact}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
