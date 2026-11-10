import { toast } from "sonner";

/**
 * notify — the single way to show feedback messages.
 *
 *   notify.success("Added to bag");
 *   notify.error("Something went wrong");
 *   notify.promise(saveProduct(), { loading: "Saving…", success: "Saved", error: "Could not save" });
 *   notify.apiError(err, "Could not load products");
 */
export const notify = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  info: (message, options) => toast.info(message, options),
  warning: (message, options) => toast.warning(message, options),
  loading: (message, options) => toast.loading(message, options),
  promise: (promise, messages) => toast.promise(promise, messages),
  dismiss: (id) => toast.dismiss(id),

  /** Show the best message we can find in an API error (Java sends { message }). */
  apiError(error, fallback = "Something went wrong. Please try again.") {
    const message =
      error?.response?.data?.message || error?.data?.message || error?.message || fallback;
    return toast.error(message);
  },
};
