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

export const Route = createFileRoute("/employee/support")({
  head: () => ({
    meta: [
      { title: "Help & Support — Poll Employee" },
      {
        name: "description",
        content: "Access platform guides, FAQs, and submit help tickets.",
      },
      { property: "og:title", content: "Help & Support — Poll Employee" },
      {
        property: "og:description",
        content: "Access platform guides, FAQs, and submit help tickets.",
      },
    ],
  }),
  component: EmployeeSupportPage,
});

const faqs = [
  {
    q: "How do I submit a task for review?",
    a: "Open your active task details, upload your completion files or notes, and click 'Submit for Review'. The task will move to pending review state.",
  },
  {
    q: "How are points credited to my profile?",
    a: "Once an admin reviews and approves your submitted task, the task's reward points are automatically added to your profile total and updated on the leaderboard.",
  },
  {
    q: "How do I update my avatar or phone number?",
    a: "Go to Settings > Profile (or Profile > Edit Profile) to upload a new avatar picture or change your contact number.",
  },
];

function EmployeeSupportPage() {
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
      toast.success("Support request sent!", {
        description: "Our team will respond to your ticket shortly.",
      });
      setSubject("");
      setMessage("");
    }, 600);
  };

  return (
    <>
      <PageHeader
        title="Help & Support"
        subtitle="Platform guides, FAQs, and technical support for employees."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass flex items-start gap-4 rounded-2xl p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold">Employee Guide</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Learn how to request tasks, submit reviews, and earn reward points.
                </p>
                <a
                  href="#faq"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View FAQ <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="glass flex items-start gap-4 rounded-2xl p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold">Platform Health</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  All systems operating normally.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[10px]">
                    Online
                  </Badge>
                </div>
              </div>
            </div>
          </div>

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

        <div className="glass flex flex-col justify-between rounded-2xl p-6">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-display text-base font-semibold">Submit a Help Ticket</h3>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Have a question or issue? Contact support directly.
            </p>

            <form onSubmit={handleSendTicket} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question about task submission"
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
                  placeholder="Describe your question or issue…"
                  className="resize-none rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full rounded-md shadow-glow" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting…" : "Send Message"}
              </Button>
            </form>
          </div>

          <div className="mt-6 border-t border-border/60 pt-4 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>support@dimisi.com</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
