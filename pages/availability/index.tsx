import Link from "next/link";

import { QueryCell } from "@lib/QueryCell";
import { useLocale } from "@lib/hooks/useLocale";
import { trpc } from "@lib/trpc";

import Shell from "@components/Shell";
import Button from "@components/ui/Button";
import Form from "@components/ui/form/Form";
import Schedule, { TimeRange, DEFAULT_SCHEDULE } from "@components/ui/form/Schedule";

type FormValues = {
  schedule: TimeRange[][];
};

const createSchedule = async ({ schedule }: TimeRange[][]) => {
  const res = await fetch(`/api/schedule`, {
    method: "POST",
    body: JSON.stringify({ schedule }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error((await res.json()).message);
  }
  const responseData = await res.json();
  return responseData.data;
};

export default function Availability() {
  const { t } = useLocale();
  const onSubmit = async ({ schedule }: FormValues) =>
    await createSchedule({
      schedule,
    });

  const query = trpc.useQuery(["viewer.availability"]);
  return (
    <div>
      <Shell heading={t("availability")} subtitle={t("configure_availability")}>
        <QueryCell
          query={query}
          success={({ data }) => (
            <div className="grid grid-cols-3 gap-2">
              <Form<FormValues>
                onSubmit={onSubmit}
                defaultValues={{ schedule: data.schedule || DEFAULT_SCHEDULE }}
                className="col-span-3 space-y-2 lg:col-span-2">
                <div className="px-4 py-5 bg-white border border-gray-200 divide-y rounded-sm sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold leading-6 text-gray-900">
                    {t("change_start_end")}
                  </h3>
                  <Schedule name="schedule" />
                </div>
                <div className="text-right">
                  <Button>{t("save")}</Button>
                </div>
              </Form>
              <div className="col-span-3 ml-2 lg:col-span-1 min-w-40">
                <div className="px-4 py-5 border border-gray-200 rounded-sm sm:p-6 ">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {t("something_doesnt_look_right")}
                  </h3>
                  <div className="max-w-xl mt-2 text-sm text-gray-500">
                    <p>{t("troubleshoot_availability")}</p>
                  </div>
                  <div className="mt-5">
                    <Link href="/availability/troubleshoot">
                      <a className="btn btn-white">{t("launch_troubleshooter")}</a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </Shell>
    </div>
  );
}
