import { useToast } from "@/hooks/use-toast"
import { Terminal, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const TerminalIcon = ({ variant }: { variant?: string | null }) => {
  const iconClass = "w-3 h-3 flex-shrink-0"
  
  switch (variant) {
    case "destructive":
      return <AlertCircle className={iconClass} />
    case "success":
      return <CheckCircle className={iconClass} />
    case "warning":
      return <AlertTriangle className={iconClass} />
    default:
      return <Terminal className={iconClass} />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <TerminalIcon variant={variant} />
            <span className="text-white/50 select-none">{">"}</span>
            <div className="flex items-center gap-1.5 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <>
                  <span className="text-white/30">|</span>
                  <ToastDescription>{description}</ToastDescription>
                </>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
