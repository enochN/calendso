import { PlusIcon, TrashIcon } from "@heroicons/react/outline";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import React, { useCallback, useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { OnChangeValue } from "react-select";

import { weekdayNames } from "@lib/core/i18n/weekday";
import { useLocale } from "@lib/hooks/useLocale";

import Button from "@components/ui/Button";
import Select from "@components/ui/form/Select";

dayjs.extend(customParseFormat);

export const _24_HOUR_TIME_FORMAT = `HH:mm:ss`;
/** Begin Time Increments For Select */
const increment = 15;
/**
 * Creates an array of times on a 15 minute interval from
 * 00:00:00 (Start of day) to
 * 23:45:00 (End of day with enough time for 15 min booking)
 */
const TIMES = (() => {
  const end = dayjs().endOf("day");
  let t: Dayjs = dayjs().startOf("day");

  const times = [];
  while (t.isBefore(end)) {
    times.push(t);
    t = t.add(increment, "minutes");
  }
  return times;
})();
/** End Time Increments For Select */

const defaultDayRange: TimeRange = {
  start: dayjs("09:00:00", _24_HOUR_TIME_FORMAT, true),
  end: dayjs("17:00:00", _24_HOUR_TIME_FORMAT, true),
};

export const DEFAULT_SCHEDULE: Schedule = [
  [],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [],
];

type Option = {
  readonly label: string;
  readonly value: string;
};

export type TimeRange = {
  start: Dayjs;
  end: Dayjs;
};

export type Schedule = TimeRange[][];

type TimeRangeFieldProps = {
  name: string;
};

const TimeRangeField = ({ name }: TimeRangeFieldProps) => {
  // Lazy-loaded options, otherwise adding a field has a noticable redraw delay.
  const [options, setOptions] = useState<Option[]>([]);

  const getOption = (time: Dayjs) => ({
    value: dayjs(time).format(_24_HOUR_TIME_FORMAT),
    label: dayjs(time).toDate().toLocaleTimeString("nl-NL", { minute: "numeric", hour: "numeric" }),
  });

  const timeOptions = useCallback((offsetOrLimit: { offset?: Dayjs; limit?: Dayjs } = {}) => {
    const { limit, offset } = offsetOrLimit;
    return TIMES.filter((time) => (!limit || time.isBefore(limit)) && (!offset || time.isAfter(offset))).map(
      getOption
    );
  }, []);

  return (
    <>
      <Controller
        name={`${name}.start`}
        render={({ field: { onChange, value } }) => (
          <Select
            className="w-[6rem]"
            options={options}
            onFocus={() => setOptions(timeOptions({ offset: value }))}
            onBlur={() => setOptions([])}
            defaultValue={getOption(value)}
            onChange={(option: OnChangeValue<Option, false>) =>
              option && onChange(dayjs(option.value, _24_HOUR_TIME_FORMAT, true))
            }
          />
        )}
      />
      <span>-</span>
      <Controller
        name={`${name}.end`}
        render={({ field: { onChange, value } }) => (
          <Select
            className="w-[6rem]"
            options={options}
            onFocus={() => setOptions(timeOptions({ offset: value }))}
            onBlur={() => setOptions([])}
            defaultValue={getOption(value)}
            onChange={(option: OnChangeValue<Option, false>) =>
              option && onChange(dayjs(option.value, _24_HOUR_TIME_FORMAT, true))
            }
          />
        )}
      />
    </>
  );
};

type ScheduleBlockProps = {
  day: number;
  weekday: string;
  name: string;
};

const ScheduleBlock = ({ name, day, weekday }: ScheduleBlockProps) => {
  const { t } = useLocale();
  const { control } = useFormContext();
  const { fields, append, remove, replace } = useFieldArray({
    name: `${name}.${day}`,
    control,
  });

  const handleAppend = () => {
    // XXX: Fix type-inference, can't get this to work. @see https://github.com/react-hook-form/react-hook-form/issues/4499
    const nextRangeStart = dayjs((fields[fields.length - 1] as unknown as TimeRange).end);
    const nextRange: TimeRange = {
      start: nextRangeStart,
      end: nextRangeStart.add(1, "hour"),
    };
    // Return if next range goes over into "tomorrow"
    if (nextRange.end.isAfter(nextRangeStart.endOf("day"))) {
      return;
    }
    return append(nextRange);
  };

  return (
    <fieldset className="flex justify-between py-5">
      <div className="w-1/3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={fields.length > 0}
            onChange={(e) => (e.target.checked ? replace([defaultDayRange]) : replace([]))}
            className="inline-block border-gray-300 rounded-sm focus:ring-neutral-500 text-neutral-900"
          />
          <span className="inline-block capitalize">{weekday}</span>
        </label>
      </div>
      <div className="flex-grow">
        {fields.map((field, index) => (
          <div key={field.id} className="flex justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TimeRangeField name={`${name}.${day}.${index}`} />
            </div>
            <Button
              size="icon"
              color="minimal"
              StartIcon={TrashIcon}
              type="button"
              onClick={() => remove(index)}
            />
          </div>
        ))}
        {!fields.length && t("no_availability")}
      </div>
      <div>
        <Button
          type="button"
          color="minimal"
          size="icon"
          className={fields.length > 0 ? "visible" : "invisible"}
          StartIcon={PlusIcon}
          onClick={handleAppend}
        />
      </div>
    </fieldset>
  );
};

const Schedule = ({ name }: { name: string }) => {
  const { i18n } = useLocale();
  return (
    <fieldset className="divide-y divide-gray-200">
      {weekdayNames(i18n.language).map((weekday, num) => (
        <ScheduleBlock key={num} name={name} weekday={weekday} day={num} />
      ))}
    </fieldset>
  );
};

export default Schedule;
