import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FutureDateConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog shown when the user attempts to save an activity with a
 * future timestamp. Matches the mobile app's `requestAllowFutureDate` behaviour:
 * the user can confirm or cancel rather than having the save silently blocked.
 */
export function FutureDateConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: FutureDateConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Future Date</AlertDialogTitle>
          <AlertDialogDescription>
            The time you entered is in the future. Are you sure you want to save
            this activity with a future timestamp?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
