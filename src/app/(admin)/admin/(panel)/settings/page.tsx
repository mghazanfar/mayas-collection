import ActionForm from "@/components/admin/ActionForm";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "../../actions";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm";

export default async function SettingsAdmin() {
  const s = await getSettings();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <ActionForm action={saveSettings} submitLabel="Save settings" className="max-w-2xl space-y-6">
        <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Owner notifications</h2>
          <label className="block text-sm">
            Owner email (new-order alerts)
            <input name="owner_email" type="email" defaultValue={s.owner_email} required className={input} />
          </label>
          <label className="block text-sm">
            Owner WhatsApp number (international format)
            <input name="owner_whatsapp" defaultValue={s.owner_whatsapp} placeholder="+923001234567" required className={input} />
          </label>
        </section>

        <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Business</h2>
          <label className="block text-sm">
            NTN
            <input name="ntn" defaultValue={s.ntn} className={input} />
          </label>
          <label className="block text-sm">
            Return address (customers post returns here)
            <textarea name="return_address" defaultValue={s.return_address} rows={3} className={input} />
          </label>
        </section>

        <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Fees (PKR)</h2>
          <p className="text-xs text-neutral-500">
            Handling is added on top of the courier charge: Lahore orders use the Lahore amount, every other Pakistani city the other-city amount.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Lahore handling
              <input name="lahore_handling" type="number" min={0} defaultValue={s.lahore_handling} className={input} />
            </label>
            <label className="text-sm">
              Other-city handling
              <input name="other_city_handling" type="number" min={0} defaultValue={s.other_city_handling} className={input} />
            </label>
            <label className="text-sm">
              Cash on delivery fee
              <input name="cod_fee" type="number" min={0} defaultValue={s.cod_fee} className={input} />
            </label>
            <label className="text-sm">
              Payment gateway fee %
              <input name="gateway_fee_pct" type="number" step="0.01" min={0} max={20} defaultValue={s.gateway_fee_pct} className={input} />
            </label>
          </div>
        </section>
      </ActionForm>
    </>
  );
}
