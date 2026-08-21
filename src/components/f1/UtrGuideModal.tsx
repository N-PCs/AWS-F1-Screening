import { useState } from "react";
import { HelpCircle, Smartphone, CheckCircle, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UtrGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UtrGuideModal({ open, onOpenChange }: UtrGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <DialogTitle className="text-lg sm:text-xl font-bold uppercase tracking-tight flex items-center gap-2 text-foreground">
            <HelpCircle className="h-5 w-5 text-primary shrink-0" />
            How to Find UTR / UPI Transaction ID
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Follow the guide below to locate your 12-digit transaction ID from your UPI app or SMS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* OK / Understood Button at Top */}
          <div>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 text-sm"
            >
              OK, I Got It — Enter UTR
            </Button>
          </div>

          {/* Image First as requested */}
          <div className="rounded-xl border border-border bg-card/60 p-2 sm:p-3 overflow-hidden shadow-sm">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-primary mb-2 px-1">
              Reference Receipt Screenshot
            </p>
            <img
              src="/utr.jpeg"
              alt="How to find UTR number / UPI transaction ID"
              className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-border/50 bg-black/30"
            />
          </div>

          {/* Universal Step-by-Step Path */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <span>🔎</span> Universal Step-by-Step Path
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No matter what app you used, the general path to find the ID follows this logic:
            </p>
            <ol className="space-y-2 text-xs sm:text-sm list-none pl-0">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] font-bold text-primary">
                  1
                </span>
                <span>Open your chosen UPI payment app.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] font-bold text-primary">
                  2
                </span>
                <span>
                  Look for the <strong>History</strong>, <strong>Activity</strong>, <strong>Balance</strong>, or <strong>Transactions</strong> tab on the home screen.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] font-bold text-primary">
                  3
                </span>
                <span>Tap the specific payment entry from the list.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] font-bold text-primary">
                  4
                </span>
                <span>
                  Locate the 12-digit number labeled as <strong>UPI Transaction ID</strong>, <strong>Bank Reference Number</strong>, <strong>UPI Ref No</strong>, or <strong>UTR</strong>.
                </span>
              </li>
            </ol>
          </div>

          {/* Specific Locations for All Major UPI Apps */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <span>📲</span> Specific Locations for All Major UPI Apps
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Each app places this number under a slightly different label on their final receipt screen:
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Google Pay */}
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-primary">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  Google Pay (GPay)
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Scroll down to the bottom of the home screen.</li>
                  <li>Tap <strong>Show transaction history</strong>.</li>
                  <li>Tap on the specific payment row.</li>
                  <li>Look at the bottom section for <strong>UPI transaction ID</strong>.</li>
                </ul>
                <p className="text-[0.7rem] text-primary/90 italic bg-primary/10 rounded px-2 py-1 mt-1">
                  💡 Tip: Tap the small overlapping squares icon next to it to copy the 12 digits.
                </p>
              </div>

              {/* PhonePe */}
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-blue-600">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  PhonePe
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Go to the <strong>History</strong> tab at the bottom right.</li>
                  <li>Select the payment.</li>
                  <li>Look under the <strong>Transfer Details</strong> dropdown section.</li>
                  <li>It is labeled explicitly as <strong>Debited From &gt; UTR</strong>.</li>
                </ul>
              </div>

              {/* Paytm */}
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-600">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  Paytm
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Tap <strong>Balance & History</strong> on the home screen.</li>
                  <li>Scroll down to Payment History and tap the transaction.</li>
                  <li>Look at the very bottom of the digital receipt.</li>
                  <li>It is labeled as <strong>UPI Ref No</strong>.</li>
                </ul>
              </div>

              {/* Navi UPI */}
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-green-500">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  Navi UPI
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Look at the bottom navigation bar.</li>
                  <li>Tap the <strong>History</strong> tab located on the far right.</li>
                  <li>Locate the payment entry from your list and tap it.</li>
                  <li>Scroll to the bottom of the digital receipt page to find <strong>UPI Transaction ID</strong>.</li>
                </ul>
              </div>

              {/* Amazon Pay */}
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-orange-500">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  Amazon Pay
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Go to the Amazon Pay dashboard.</li>
                  <li>Tap <strong>Transactions</strong> or <strong>Your Orders</strong>.</li>
                  <li>Select the specific transaction.</li>
                  <li>Look for the field named <strong>Bank Reference ID</strong> or <strong>UPI Transaction ID</strong>.</li>
                </ul>
              </div>

              {/* CRED */}
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-pink-500">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  CRED
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Tap your <strong>Profile icon</strong> at the top right.</li>
                  <li>Select <strong>Transactions</strong> or <strong>Payment History</strong>.</li>
                  <li>Click on the specific payment card.</li>
                  <li>Look for the 12-digit <strong>UPI Ref No</strong> at the bottom.</li>
                </ul>
              </div>

              {/* Official BHIM App */}
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1.5 sm:col-span-2 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-purple-500">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  Official BHIM App
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Go to the <strong>Transactions</strong> tab at the bottom center.</li>
                  <li>Tap the required transaction.</li>
                  <li>Look for the field marked <strong>NPCI Txn ID</strong> or <strong>UTR</strong>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SMS Backup Section */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
            <h3 className="font-bold text-sm sm:text-base text-amber-500 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>💡</span> The Ultimate Backup: Text Messages (SMS)
            </h3>
            <p className="text-xs text-muted-foreground">
              If your payment app crashes, fails to load, or won't open, you can easily find the number via SMS:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
              <li>Open your phone's default text messaging app.</li>
              <li>Search your inbox for the exact transaction amount or the word <strong>UPI</strong>.</li>
              <li>Open your bank’s official automated debit SMS notification.</li>
            </ul>
            <div className="mt-2 rounded bg-black/40 p-2 text-xs font-mono text-amber-300 border border-amber-500/20">
              "Rs. 500 debited from A/c ... Ref No: 6XXXXXXXXXXX"
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UtrGuideTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        id="utr-guide-trigger-btn"
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer transition-colors",
          className
        )}
      >
        <HelpCircle className="h-3.5 w-3.5 shrink-0" />
        How to find UTR number / UPI transaction ID?
      </button>
      <UtrGuideModal open={open} onOpenChange={setOpen} />
    </>
  );
}
