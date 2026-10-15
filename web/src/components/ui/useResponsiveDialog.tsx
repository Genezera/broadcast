import { forwardRef, type ReactElement, type Ref } from "react";
import { Grow, Slide, useMediaQuery } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Props de diálogo adaptadas ao aparelho: no celular o formulário ocupa a
 * tela inteira e sobe de baixo (fica mais confortável de preencher); em
 * telas maiores continua uma janela centralizada com efeito "grow".
 */
export function useResponsiveDialog() {
  const fullScreen = useMediaQuery("(max-width: 599px)");
  return { fullScreen, slots: { transition: fullScreen ? SlideUp : Grow } };
}
