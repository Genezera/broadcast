import { Avatar, IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { formatDateTime } from "../../../lib/dates";
import type { Contact } from "../../../types";

type ContactsTableProps = {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
};

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead className="bg-[#fbfbfd] text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-6 py-4 font-bold">Nome</th>
            <th className="px-6 py-4 font-bold">Telefone</th>
            <th className="px-6 py-4 font-bold">Cadastro</th>
            <th className="px-6 py-4 text-right font-bold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr
              key={contact.id}
              className="animate-row border-t border-line transition-colors hover:bg-[#faf9ff]"
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
              <td className="px-6 py-4 text-[#7f8298]">{contact.phone}</td>
              <td className="px-6 py-4 text-sm text-muted">
                {formatDateTime(contact.createdAt)}
              </td>
              <td className="px-6 py-4 text-right">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
