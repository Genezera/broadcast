import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { TextField, type TextFieldProps } from "@mui/material";

type FormTextFieldProps<T extends FieldValues> = Omit<
  TextFieldProps,
  "name" | "defaultValue" | "error"
> & {
  control: Control<T>;
  name: Path<T>;
};

/** Integra o `TextField` do MUI ao React Hook Form, exibindo o erro de validação. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  helperText,
  ...props
}: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { ref, value, ...field }, fieldState }) => (
        <TextField
          {...props}
          {...field}
          value={value ?? ""}
          inputRef={ref}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}
