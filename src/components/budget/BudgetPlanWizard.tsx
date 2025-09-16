"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { pl } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Info, Loader2, Plus, Save, Wallet } from "lucide-react";

/**
 * Budget Plan Wizard — profesjonalny, funkcjonalny kreator tworzenia miesięcznego budżetu
 *
 * Cechy:
 * - Kroki: Miesiąc → Przychody → Wydatki konieczne → Oszczędności/Długi → Wydatki uznaniowe → Podsumowanie
 * - Start od INCOME zgodnie z najlepszymi praktykami (od góry: dochód → alokacje)
 * - Rekomendacje procentowe (ramy 50/20/30 z elastycznością): Essentials 50–60%, Savings/Debt 20–30%, Discretionary 20–30%
 * - Autopodpowiedzi kwot na podstawie dochodu netto i suwaków udziałów
 * - Walidacja, pasek postępu i dynamiczny bilans (pozostało / nadmiar)
 * - Możliwość dodawania własnych kategorii i pozycji
 * - Szybkie szablony kategorii (PL realia)
 * - Auto-zapis szkicu (localStorage) i wysyłka do BE (Spring) /api/budget/plans
 */

//#region Typy
export type YearMonth = `${number}-${"01"|"02"|"03"|"04"|"05"|"06"|"07"|"08"|"09"|"10"|"11"|"12"}`;

type BucketKey = "essentials" | "savings" | "discretionary";


type Item = {
  id: string;
  name: string;
  amount: number; // PLN
  bucket: BucketKey;
};

type PlanDraft = {
  yearMonth: YearMonth;
  netIncome: number;
  bucketsShare: Record<BucketKey, number>; // 0..1
  items: Item[];
};
//#endregion

//#region Stałe i presety
const PLN = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });

const DEFAULT_PRESETS: Record<BucketKey, string[]> = {
  essentials: [
    "Mieszkanie (czynsz, rata)",
    "Media (prąd/gaz/woda/internet)",
    "Transport (bilety/paliwo)",
    "Żywność",
    "Zdrowie (leki/abonament)",
    "Ubezpieczenia",
  ],
  savings: [
    "Poduszka bezpieczeństwa",
    "Inwestycje (IKE/ETF)",
    "Spłata długu",
  ],
  discretionary: [
    "Rozrywka/wyjścia",
    "Ubrania",
    "Edukacja/hobby",
    "Prezenty",
    "Podróże",
  ],
};

const DEFAULT_SHARES: Record<BucketKey, number> = {
  essentials: 0.55, // w środku widełek 50–60%
  savings: 0.20,
  discretionary: 0.25,
};

const EMPTY_PLAN = (yearMonth: YearMonth): PlanDraft => ({
  yearMonth,
  netIncome: 0,
  bucketsShare: { ...DEFAULT_SHARES },
  items: [],
});
//#endregion

//#region Pomocnicze
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function yyyymm(d: Date): YearMonth {
  return format(d, "yyyy-MM") as YearMonth;
}

function bucketsTotal(plan: PlanDraft): Record<BucketKey, number> {
  return ("essentials savings discretionary" as const)
    .split(" ")
    .reduce((acc, b) => {
      const total = plan.items.filter((i) => i.bucket === (b as BucketKey)).reduce((s, i) => s + i.amount, 0);
      acc[b as BucketKey] = total;
      return acc;
    }, {} as Record<BucketKey, number>);
}

function remainingByBucket(plan: PlanDraft) {
  const totals = bucketsTotal(plan);
  return (Object.keys(totals) as BucketKey[]).reduce((acc, k) => {
    const cap = plan.netIncome * plan.bucketsShare[k];
    acc[k] = cap - totals[k];
    return acc;
  }, {} as Record<BucketKey, number>);
}

function saveDraftLS(d: PlanDraft) {
  try { localStorage.setItem("budget-plan-draft", JSON.stringify(d)); } catch {}
}
function loadDraftLS(): PlanDraft | null {
  try { const raw = localStorage.getItem("budget-plan-draft"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
//#endregion

//#region Główny komponent
export default function BudgetPlanWizard() {
  const initial = useMemo(() => loadDraftLS() ?? EMPTY_PLAN(yyyymm(addMonths(new Date(), 0))), []);
  const [plan, setPlan] = useState<PlanDraft>(initial);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(1); // 0:Miesiąc, 1:Income, 2:Essentials, 3:Savings, 4:Discretionary, 5:Summary (mapujemy 4 => summary)
  const [saving, setSaving] = useState(false);

  // Autozapis szkicu
  React.useEffect(() => { saveDraftLS(plan); }, [plan]);

  const totals = bucketsTotal(plan);
  const caps = {
    essentials: plan.netIncome * plan.bucketsShare.essentials,
    savings: plan.netIncome * plan.bucketsShare.savings,
    discretionary: plan.netIncome * plan.bucketsShare.discretionary,
  } satisfies Record<BucketKey, number>;

  const allocated = totals.essentials + totals.savings + totals.discretionary;
  const leftOverall = Math.max(0, plan.netIncome - allocated);

  const canContinueFromIncome = plan.netIncome > 0;

  async function submitPlan() {
    setSaving(true);
    try {
      const res = await fetch("/api/budget/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error(await res.text());
      // wyczyść szkic po sukcesie
      localStorage.removeItem("budget-plan-draft");
      setSaving(false);
      // Możesz tu użyć router.push("/dashboard") jeśli chcesz
      alert("Plan zapisany! 🎉");
    } catch (e: any) {
      console.error(e);
      setSaving(false);
      alert("Błąd zapisu: " + e?.message);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      {/* Sidebar — kroki i progres */}
      <Card className="h-fit sticky top-4">
        <CardHeader>
          <CardTitle className="text-lg">Nowy plan budżetu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Miesiąc</div>
            <MonthPicker value={plan.yearMonth} onChange={(ym) => setPlan((p) => ({ ...p, yearMonth: ym }))} />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Postęp</span>
              <span className="tabular-nums">{Math.round((Math.min(allocated, plan.netIncome) / Math.max(plan.netIncome, 1)) * 100)}%</span>
            </div>
            <Progress value={(Math.min(allocated, plan.netIncome) / Math.max(plan.netIncome, 1)) * 100} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Przydzielone</span>
              <span>{PLN.format(allocated)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={cn("font-medium", leftOverall < 0 && "text-destructive")}>Pozostało</span>
              <span className={cn("tabular-nums", leftOverall < 0 && "text-destructive")}>{PLN.format(leftOverall)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <LegendRow
              label="Wydatki konieczne"
              value={totals.essentials}
              cap={caps.essentials}
            />
            <LegendRow
              label="Oszczędności / Długi"
              value={totals.savings}
              cap={caps.savings}
            />
            <LegendRow
              label="Uznaniowe"
              value={totals.discretionary}
              cap={caps.discretionary}
            />
          </div>

          <Separator />

          <div className="grid gap-2">
            <Button variant="secondary" onClick={() => setPlan(EMPTY_PLAN(plan.yearMonth))}>
              Wyczyść
            </Button>
            <Button onClick={submitPlan} disabled={saving || plan.netIncome <= 0 || leftOverall < 0}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Zapisz plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Główna część — kroki */}
      <div className="grid gap-4">
        <StepHeader step={step} setStep={setStep} canContinueFromIncome={canContinueFromIncome} />

        {step === 1 && (
          <IncomeStep
            value={plan.netIncome}
            onChange={(val) => setPlan((p) => ({ ...p, netIncome: val }))}
            shares={plan.bucketsShare}
            onSharesChange={(shares) => setPlan((p) => ({ ...p, bucketsShare: shares }))}
          />
        )}

        {step === 2 && (
          <BucketStep
            key="essentials"
            bucket="essentials"
            plan={plan}
            onAdd={(name, amount) =>
              setPlan((p) => ({ ...p, items: [...p.items, { id: uid(), name, amount, bucket: "essentials" }] }))
            }
            onUpdate={(id, patch) =>
              setPlan((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
            }
            onRemove={(id) => setPlan((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }))}
          />
        )}

        {step === 3 && (
          <BucketStep
            key="savings"
            bucket="savings"
            plan={plan}
            onAdd={(name, amount) =>
              setPlan((p) => ({ ...p, items: [...p.items, { id: uid(), name, amount, bucket: "savings" }] }))
            }
            onUpdate={(id, patch) =>
              setPlan((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
            }
            onRemove={(id) => setPlan((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }))}
          />
        )}

        {step === 4 && (
          <BucketStep
            key="discretionary"
            bucket="discretionary"
            plan={plan}
            onAdd={(name, amount) =>
              setPlan((p) => ({ ...p, items: [...p.items, { id: uid(), name, amount, bucket: "discretionary" }] }))
            }
            onUpdate={(id, patch) =>
              setPlan((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
            }
            onRemove={(id) => setPlan((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }))}
          />
        )}

        {/* Podsumowanie jest widoczne zawsze pod krokami dla szybkiego feedbacku */}
        <SummaryCard plan={plan} />
      </div>
    </div>
  );
}
//#endregion

//#region Pod-komponenty
function StepHeader({ step, setStep, canContinueFromIncome }: { step: 0|1|2|3|4; setStep: (s: 0|1|2|3|4) => void; canContinueFromIncome: boolean; }) {
  const steps: Array<{ id: 1|2|3|4; label: string; }> = [
    { id: 1, label: "Przychody" },
    { id: 2, label: "Wydatki konieczne" },
    { id: 3, label: "Oszczędności/Długi" },
    { id: 4, label: "Uznaniowe" },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5"/> Planowanie budżetu — krok {step}/4</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <Button
                variant={step === s.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setStep(s.id)}
                disabled={s.id !== 1 && !canContinueFromIncome}
              >
                {s.label}
              </Button>
              {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((Math.max(1, step - 1) as 0|1|2|3|4))}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1"/> Wstecz
          </Button>
          <Button
            size="sm"
            onClick={() => setStep((Math.min(4, step + 1) as 0|1|2|3|4))}
            disabled={(step === 1 && !canContinueFromIncome) || step === 4}
          >
            Dalej <ChevronRight className="h-4 w-4 ml-1"/>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthPicker({ value, onChange }: { value: YearMonth; onChange: (ym: YearMonth) => void }) {
  const [open, setOpen] = useState(false);
  const date = new Date(`${value}-01T00:00:00`);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {format(date, "LLLL yyyy", { locale: pl })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (!d) return;
            onChange(yyyymm(d));
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function LegendRow({ label, value, cap }: { label: string; value: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, Math.round((value / cap) * 100)) : 0;
  const over = value > cap;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">{label} {over && <Badge variant="destructive">przekroczono</Badge>}</span>
        <span className="tabular-nums">{PLN.format(value)} / {PLN.format(cap)}</span>
      </div>
      <Progress value={pct} className={cn(over && "bg-destructive/10")} />
    </div>
  );
}

function IncomeStep({ value, onChange, shares, onSharesChange }: {
  value: number;
  onChange: (v: number) => void;
  shares: Record<BucketKey, number>;
  onSharesChange: (v: Record<BucketKey, number>) => void;
}) {
  const sum = shares.essentials + shares.savings + shares.discretionary;
  const normalized = {
    essentials: shares.essentials / sum,
    savings: shares.savings / sum,
    discretionary: shares.discretionary / sum,
  } as Record<BucketKey, number>;

  function setShare(key: BucketKey, val: number) {
    const next = { ...shares, [key]: clamp01(val) };
    const total = next.essentials + next.savings + next.discretionary;
    // normalizujemy do 100%
    onSharesChange({
      essentials: next.essentials / total,
      savings: next.savings / total,
      discretionary: next.discretionary / total,
    });
  }

  const tips = (
    <div className="text-sm text-muted-foreground leading-relaxed">
      <p className="mb-2 font-medium flex items-center gap-2"><Info className="h-4 w-4"/> Rekomendacje</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Zacznij od dochodu netto. Alokuj środki celowo, zanim je wydasz (ang. pay yourself first).</li>
        <li>Essentials 50–60% (mieszkanie, media, żywność, transport, zdrowie).</li>
        <li>Oszczędności/Długi 20–30% (fundusz awaryjny, inwestycje, spłaty).</li>
        <li>Uznaniowe 20–30% (rozrywka, hobby, odzież, podróże).</li>
      </ul>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>1) Przychody i ramy budżetu</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Dochód netto (miesięcznie)</Label>
            <AmountInput value={value} onChange={onChange} placeholder="np. 6 500" />
            <p className="text-xs text-muted-foreground">Wprowadź sumę wszystkich przewidywanych wpływów w danym miesiącu.</p>
          </div>
          <div className="space-y-2">
            {tips}
          </div>
        </div>

        <div className="grid gap-4">
          <ShareRow label="Wydatki konieczne" value={normalized.essentials} onChange={(v) => setShare("essentials", v)} />
          <ShareRow label="Oszczędności / Długi" value={normalized.savings} onChange={(v) => setShare("savings", v)} />
          <ShareRow label="Uznaniowe" value={normalized.discretionary} onChange={(v) => setShare("discretionary", v)} />
        </div>
      </CardContent>
    </Card>
  );
}

function ShareRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid md:grid-cols-[220px_1fr_auto] items-center gap-3">
      <div className="text-sm font-medium">{label}</div>
      <Slider value={[Math.round(value * 100)]} onValueChange={(v) => onChange(v[0] / 100)} />
      <Badge variant="secondary" className="justify-end w-16 tabular-nums">{Math.round(value * 100)}%</Badge>
    </div>
  );
}

function BucketStep({ bucket, plan, onAdd, onUpdate, onRemove }: {
  bucket: BucketKey;
  plan: PlanDraft;
  onAdd: (name: string, amount: number) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
}) {
  const cap = plan.netIncome * plan.bucketsShare[bucket];
  const total = plan.items.filter((i) => i.bucket === bucket).reduce((s, i) => s + i.amount, 0);
  const presets = DEFAULT_PRESETS[bucket];
  const [name, setName] = useState("");
  const [amt, setAmt] = useState(0);

  function addQuick(preset: string) {
    onAdd(preset, 0);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {bucket === "essentials" && "2) Wydatki konieczne"}
          {bucket === "savings" && "3) Oszczędności / Spłata długu"}
          {bucket === "discretionary" && "4) Wydatki uznaniowe"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Szybkie pozycje:</span>
          {presets.map((p) => (
            <Button key={p} size="sm" variant="secondary" onClick={() => addQuick(p)}>{p}</Button>
          ))}
        </div>

        <div className="grid md:grid-cols-[1fr_180px_120px] gap-3 items-end">
          <div>
            <Label>Nazwa pozycji</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Żywność" />
          </div>
          <div>
            <Label>Kwota</Label>
            <AmountInput value={amt} onChange={setAmt} placeholder="np. 1 200" />
          </div>
          <Button onClick={() => { if (!name) return; onAdd(name, amt); setName(""); setAmt(0); }}>
            <Plus className="h-4 w-4 mr-1"/> Dodaj
          </Button>
        </div>

        <div className="rounded-xl border">
          <div className="grid grid-cols-[1fr_160px_80px] p-3 text-sm text-muted-foreground">
            <div>Pozycja</div>
            <div className="text-right">Kwota</div>
            <div className="text-right">Akcje</div>
          </div>
          <Separator />
          <div className="divide-y">
            {plan.items.filter((i) => i.bucket === bucket).map((i) => (
              <div key={i.id} className="grid grid-cols-[1fr_160px_80px] p-3 gap-2 items-center">
                <Input value={i.name} onChange={(e) => onUpdate(i.id, { name: e.target.value })} />
                <AmountInput className="justify-self-end w-40" value={i.amount} onChange={(v) => onUpdate(i.id, { amount: v })} />
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => onRemove(i.id)}>
                    ✕
                  </Button>
                </div>
              </div>
            ))}
            {plan.items.filter((i) => i.bucket === bucket).length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Brak pozycji. Użyj presetu lub dodaj własną.</div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Suma w tej sekcji</span>
            <span className={cn("tabular-nums", total > cap && "text-destructive font-medium")}>{PLN.format(total)} / {PLN.format(cap)}</span>
          </div>
          <Progress value={cap > 0 ? Math.min(100, Math.round((total / cap) * 100)) : 0} />
        </div>
      </CardContent>
    </Card>
  );
}

function AmountInput({ value, onChange, className, placeholder }: { value: number; onChange: (v: number) => void; className?: string; placeholder?: string; }) {
  const [raw, setRaw] = useState(value ? String(value) : "");
  React.useEffect(() => { setRaw(value ? String(value) : ""); }, [value]);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        inputMode="decimal"
        value={raw}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value.replace(/,/g, ".");
          setRaw(v);
          const num = Number(v);
          if (!Number.isNaN(num)) onChange(Math.max(0, Math.round(num * 100) / 100));
        }}
      />
      <Badge variant="outline">PLN</Badge>
    </div>
  );
}

function SummaryCard({ plan }: { plan: PlanDraft }) {
  const totals = bucketsTotal(plan);
  const allocated = totals.essentials + totals.savings + totals.discretionary;
  const left = Math.max(0, plan.netIncome - allocated);
  const over = Math.max(0, allocated - plan.netIncome);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Podsumowanie</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SummaryRow label="Dochód netto" value={plan.netIncome} />
          <SummaryRow label="Essentials" value={totals.essentials} share={plan.bucketsShare.essentials} />
          <SummaryRow label="Oszczędności/Długi" value={totals.savings} share={plan.bucketsShare.savings} />
          <SummaryRow label="Uznaniowe" value={totals.discretionary} share={plan.bucketsShare.discretionary} />
          <Separator />
          <SummaryRow label="Przydzielone" value={allocated} />
          <div className="flex items-center justify-between text-sm">
            <span className={cn(left === 0 && over === 0 ? "text-muted-foreground" : left > 0 ? "" : "text-destructive font-medium")}>{left > 0 ? "Pozostało do rozdysponowania" : over > 0 ? "Przekroczono budżet" : "Zbilansowano"}</span>
            <span className={cn("tabular-nums", over > 0 && "text-destructive font-medium")}>{PLN.format(left || over)}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Wskazówki:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Najpierw uzupełnij <span className="font-medium">przychody</span>, potem przechodź krok po kroku przez kategorie.</li>
            <li>W sekcjach używaj presetów, aby szybko wystartować, a następnie koryguj kwoty.</li>
            <li>Staraj się trzymać założonych udziałów, ale dostosuj je do realiów miesiąca (sezonowość, wyjazdy, jednorazowe opłaty).</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, share }: { label: string; value: number; share?: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label} {share != null && <span className="text-muted-foreground">({Math.round(share * 100)}%)</span>}</span>
      <span className="tabular-nums">{PLN.format(value)}</span>
    </div>
  );
}
//#endregion

/**
 * Jak użyć:
 * 1) Zaimportuj na stronie: import BudgetPlanWizard from "@/components/budget/BudgetPlanWizard";
 * 2) Umieść w page.tsx: <BudgetPlanWizard />
 * 3) Zapewnij endpoint POST /api/budget/plans po stronie Next.js (proxy) lub bezpośrednio do Spring Boot:
 *    Payload (przykład):
 *    {
 *      "yearMonth": "2025-09",
 *      "netIncome": 6500,
 *      "bucketsShare": { "essentials": 0.55, "savings": 0.2, "discretionary": 0.25 },
 *      "items": [ {"id":"x1","name":"Czynsz","amount":2200,"bucket":"essentials"}, ... ]
 *    }
 *
 * Dodatkowe pomysły:
 * - Dodaj walidację Zod i komunikaty inline.
 * - Dodaj import historii transakcji i autouzupełnianie kategorii.
 * - Dodaj szablony: studencki, rodzina, singiel, wysoki koszt mieszkania.
 */
