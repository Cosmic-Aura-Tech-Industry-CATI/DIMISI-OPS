import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LifeBuoy,
  BookOpen,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Send,
  CheckCircle2,
  PhoneCall,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/support")({
  head: () => ({
    meta: [
      { title: "Help & Support — Dimisi Operations" },
      {
        name: "description",
        content: "Access platform guides, FAQs, system status, and operations support.",
      },
      { property: "og:title", content: "Help & Support — Dimisi Operations" },
      {
        property: "og:description",
        content: "Access platform guides, FAQs, system status, and operations support.",
      },
    ],
  }),
  component: AdminSupportPage,
});

const faqs = [
  {
    q: "How do task reviews and points allocations work?",
    a: "When an employee submits a task, it enters the Review Center. Admins can approve or reject the submission. Approving credits the task's points to the employee's leaderboard total automatically.",
  },
  {
    q: "How do I add a new employee or admin to the platform?",
    a: "Navigate to Admin Portal > Employees (or Admins) and click 'Add New Employee'. Fill in the required credentials and department role. The user can then sign in using their assigned email.",
  },
  {
    q: "What should I do if two-factor authentication fails?",
    a: "If an authenticator code is lost, admins can issue backup single-use recovery codes from Settings > Security or reset 2FA preferences via the Admin user management panel.",
  },
  {
    q: "How are quiet hours and notification schedules enforced?",
    a: "Notifications triggered during designated quiet hours (configurable in Settings > Notifications) are batched and queued for morning delivery while maintaining urgent real-time alerts.",
  },
];

function AdminSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both the subject and message.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Support ticket submitted successfully!", {
        description: "Our operations team will respond within 24 hours.",
      });
      setSubject("");
      setMessage("");
    }, 600);
  };

  return (
    <>
      <PageHeader
        title="Help & Support"
        subtitle="Platform documentation, FAQs, system health, and direct technical support."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Support Resources */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Resource Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass flex items-start gap-4 rounded-2xl p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold">Platform Documentation</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete user manual covering workflows, tasks, and admin controls.
                </p>
                <a
                  href="#faq"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View guides <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="glass flex items-start gap-4 rounded-2xl p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold">System Operational Status</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  All systems operational. API response time: 24ms.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[10px]">
                    100% Uptime
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="glass rounded-2xl p-6" id="faq">
            <div className="mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="font-display text-base font-semibold">Frequently Asked Questions</h3>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="glass flex flex-col justify-between rounded-2xl p-6">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-display text-base font-semibold">Contact Operations Support</h3>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Need assistance? Send a message directly to our technical support team.
            </p>

            <form onSubmit={handleSendTicket} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue with task review approval"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or feedback in detail…"
                  className="resize-none rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full rounded-md shadow-glow" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting…" : "Send Ticket"}
              </Button>
            </form>
          </div>

          <div className="mt-6 border-t border-border/60 pt-4 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>support@dimisi.com</span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneCall className="h-3.5 w-3.5 text-primary" />
              <span>+1 (800) 555-DIMISI</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
