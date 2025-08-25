import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import { AdminContentTabs } from "@/components/admin-ui/AdminContentTabs";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin-ui/AdminCard";
import { MainContentContainer } from "@/components/admin-ui/MainContentContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Mail, MessageCircle, Inbox, Trash2, Search } from "lucide-react";
import { useState } from "react";

export type SiteInquiry = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  athleteInfo?: string;
  message: string;
  status: "new" | "open" | "closed" | "archived";
  source?: string;
  createdAt: string;
};

export default function AdminMessagesTab() {
  const [tab, setTab] = useState("inquiries");
  const [searchTerm, setSearchTerm] = useState("");
  const qc = useQueryClient();

  const inquiries = useQuery<SiteInquiry[]>({
    queryKey: ["/api/admin/site-inquiries"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/site-inquiries");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: SiteInquiry["status"] }) => {
      const res = await apiRequest("PATCH", `/api/admin/site-inquiries/${id}`, { status });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/site-inquiries"] }),
  });

  const deleteInquiry = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/site-inquiries/${id}`);
      if (!res.ok) throw new Error("Failed to delete inquiry");
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/site-inquiries"] }),
  });

  return (
    <div className="space-y-6">
      <AdminContentTabs
        value={tab}
        onValueChange={setTab}
        items={[
          {
            value: "sms",
            label: "SMS",
            icon: <MessageCircle className="h-4 w-4" />,
            activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
          },
          {
            value: "emails",
            label: "Emails",
            icon: <Mail className="h-4 w-4" />,
            activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
          },
          {
            value: "inquiries",
            label: "Site Inquiries",
            icon: <Inbox className="h-4 w-4" />,
            activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
          },
        ]}
        listClassName="bg-slate-100 text-[#0F0276] dark:bg-[#D8BD2A]/10 dark:text-white border-slate-200 dark:border-[#D8BD2A]/20 mb-4"
        triggerClassName="gap-2"
      >

        <TabsContent value="sms">
          <AdminCard className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
            <AdminCardHeader>
              <AdminCardTitle className="text-[#0F0276] dark:text-white">SMS Messages</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              <p className="text-sm text-slate-600 dark:text-white/80">SMS integration coming soon. This tab will show inbound/outbound texts.</p>
            </AdminCardContent>
          </AdminCard>
        </TabsContent>

        <TabsContent value="emails">
          <AdminCard className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
            <AdminCardHeader>
              <AdminCardTitle className="text-[#0F0276] dark:text-white">Email Messages</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              <p className="text-sm text-slate-600 dark:text-white/80">Email logs overview coming soon. We'll surface recent sends and failures.</p>
            </AdminCardContent>
          </AdminCard>
        </TabsContent>

        <TabsContent value="inquiries">
          <div className="space-y-6">
            <AdminCard className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
              <AdminCardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 w-full">
                  <AdminCardTitle className="inline-flex items-center gap-2 sm:gap-3 text-[#0F0276] dark:text-white">
                    <Inbox className="h-8 w-8 text-[#D8BD2A]" />
                    Site Inquiries
                    <Badge variant="secondary" className="bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30 text-[#0F0276] dark:text-white font-bold rounded-xl px-3 py-1">
                      {inquiries.data?.length || 0} total
                    </Badge>
                  </AdminCardTitle>
                  <div className="relative max-w-md w-full sm:w-auto">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-300 h-5 w-5" />
                    <Input
                      placeholder="Search inquiries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 rounded-xl border-0 bg-slate-50/80 dark:bg-white/10 dark:text-white dark:placeholder-white/70 focus:ring-2 focus:ring-[#0F0276] dark:focus:ring-[#D8BD2A] focus:bg-white dark:focus:bg-white/20 transition-all duration-200 text-base"
                    />
                  </div>
                </div>
              </AdminCardHeader>
            </AdminCard>

            {inquiries.isLoading ? (
              <div className="flex items-center gap-2 text-slate-600 dark:text-white/80">
                <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="h-4 w-4 animate-spin" /> Loading inquiries…
              </div>
            ) : (inquiries.data?.length ? (
              <div className="space-y-3">
                {inquiries.data
                  .filter(inq => {
                    if (!searchTerm) return true;
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      inq.name.toLowerCase().includes(searchLower) ||
                      inq.email.toLowerCase().includes(searchLower) ||
                      inq.message.toLowerCase().includes(searchLower) ||
                      (inq.phone && inq.phone.toLowerCase().includes(searchLower)) ||
                      (inq.athleteInfo && inq.athleteInfo.toLowerCase().includes(searchLower))
                    );
                  })
                  .map((inq) => (
                  <AdminCard key={inq.id} className="rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] dark:border-white/10 dark:bg-white/10">
                    <AdminCardContent className="p-6">
                      {/* Header: name/date left, actions top-right on mobile */}
                      <div className="relative mb-24 sm:mb-3">
                        <div className="font-medium text-[#0F0276] dark:text-white pr-28 sm:pr-0">
                          {inq.name} <span className="text-slate-500 dark:text-white/70">•</span>{" "}
                          <span className="text-slate-600 dark:text-white/80 text-sm">{new Date(inq.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="absolute right-2 top-2 flex flex-col items-end gap-2 sm:static sm:flex-row sm:items-center">
                          <Badge variant={inq.status === 'new' ? 'default' : inq.status === 'open' ? 'secondary' : 'outline'} className="uppercase">
                            {inq.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: inq.id, status: inq.status === 'new' ? 'open' : inq.status === 'open' ? 'closed' : 'archived' })}
                            className="w-auto"
                          >
                            Mark {inq.status === 'new' ? 'Open' : inq.status === 'open' ? 'Closed' : 'Archived'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteInquiry.mutate(inq.id)} className="w-auto">
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-white/90">
                        <div><span className="text-slate-500 dark:text-white/70">Email:</span> {inq.email}</div>
                        {inq.phone ? <div><span className="text-slate-500 dark:text-white/70">Phone:</span> {inq.phone}</div> : null}
                        {inq.athleteInfo ? <div><span className="text-slate-500 dark:text-white/70">Athlete:</span> {inq.athleteInfo}</div> : null}
                        <div className="mt-2 whitespace-pre-wrap">{inq.message}</div>
                      </div>
                    </AdminCardContent>
                  </AdminCard>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-white/80">No inquiries yet. Messages sent via the Contact page will appear here.</p>
            ))}
          </div>
        </TabsContent>
      </AdminContentTabs>
    </div>
  );
}
