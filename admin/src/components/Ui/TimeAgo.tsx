
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { languageStore, toBengaliNum } from "../../stores/language.store";

type Props = {
    date:Date
}

const TimeAgo = ({ date }:Props) => {
  const { language } = languageStore();
  const isBn = language === "bn";
  const loc = (n: number) => (isBn ? toBengaliNum(n) : String(n));

  const units = isBn ? { m: "মি.", H: "ঘ.", D: "দিন", Mo: "মাস", Y: "বছর" } : { m: "m", H: "H", D: "D", Mo: "Mo", Y: "Y" };
  const ago = isBn ? "আগে" : "ago";
  const later = isBn ? "পরে" : "in";
  const now = new Date();
  const targetDate = new Date(date);

  const mins = differenceInMinutes(now, targetDate);
  const hours = differenceInHours(now, targetDate);
  const days = differenceInDays(now, targetDate);
  const months = differenceInMonths(now, targetDate);
  const years = differenceInYears(now, targetDate);

  let text = "";
  let colorClass = "text-gray-500";


  if (mins < 0) {
  // future date
  const absMins = Math.abs(mins);
  const absHours = Math.abs(hours);
  const absDays = Math.abs(days);
  const absMonths = Math.abs(months);
  const absYears = Math.abs(years);

  if (absMins < 60) {
    text = `${later} ${loc(absMins)} ${units.m}`;
    colorClass = "text-green-500";
  } else if (absHours < 24) {
    text = `${later} ${loc(absHours)} ${units.H}`;
    colorClass = "text-blue-500";
  } else if (absDays < 30) {
    text = `${later} ${loc(absDays)} ${units.D}`;
    colorClass = "text-yellow-500";
  } else if (absMonths < 12) {
    text = `${later} ${loc(absMonths)} ${units.Mo}`;
    colorClass = "text-orange-500";
  } else {
    text = `${later} ${loc(absYears)} ${units.Y}`;
    colorClass = "text-red-500";
  }
} else {
    if (mins < 60) {
    text = `${loc(mins)} ${units.m} ${ago}`;
    colorClass = "text-green-500";
  } else if (hours < 24) {
    text = `${loc(hours)} ${units.H} ${ago}`;
    colorClass = "text-blue-500";
  } else if (days < 30) {
    text = `${loc(days)} ${units.D} ${ago}`;
    colorClass = "text-yellow-500";
  } else if (months < 12) {
    text = `${loc(months)} ${units.Mo} ${ago}`;
    colorClass = "text-orange-500";
  } else {
    text = `${loc(years)} ${units.Y} ${ago}`;
    colorClass = "text-red-500";
  }
}

  return <span className={colorClass}>{text}</span>;
};

export default TimeAgo;
