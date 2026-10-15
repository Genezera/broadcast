import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { PhoneField } from "./PhoneField";

type FormPhoneFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  autoFocus?: boolean;
};

/** Liga o PhoneField ao React Hook Form, exibindo o erro de validação. */
export function FormPhoneField<T extends FieldValues>({
  control,
  name,
  label,
  autoFocus,
}: FormPhoneFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PhoneField
          name={field.name}
          label={label}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          autoFocus={autoFocus}
        />
      )}
    />
  );
}
