import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface CompanyReport {
  name: string;
  industry: string;
  time: string;
}

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: DayType | null, ref: React.RefObject<HTMLDivElement> | null) => void;
  onClick: (day: DayType) => void;
}

type DayType = {
  day: string;
  classNames: string;
  reports?: CompanyReport[];
};

const Day: React.FC<DayProps> = ({ classNames, day, onHover, onClick }) => {
  const dayRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={dayRef}
      className={`relative flex items-center justify-center ${classNames} ${day.reports && day.reports.length > 0 ? 'cursor-pointer' : ''}`}
      style={{ aspectRatio: '1', borderRadius: 12 }}
      onMouseEnter={() => onHover(day, dayRef)}
      onMouseLeave={() => onHover(null, null)}
      onClick={() => day.reports && day.reports.length > 0 && onClick(day)}
      id={`day-${day.day}`}
    >
      <motion.div className="flex flex-col items-center justify-center">
        {!(day.day[0] === "+" || day.day[0] === "-") && (
          <span className="text-sm text-white">{day.day}</span>
        )}
      </motion.div>
      {day.reports && day.reports.length > 0 && (
        <motion.div
          className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-zinc-700 text-white text-[10px] font-bold flex items-center justify-center"
          layoutId={`day-${day.day}-report-count`}
        >
          {day.reports.length}
        </motion.div>
      )}
    </motion.div>
  );
};

const CalendarGrid: React.FC<{ onHover: (day: DayType | null, ref: React.RefObject<HTMLDivElement> | null) => void; days: DayType[]; onDayClick: (day: DayType) => void }> = ({
  onHover,
  days,
  onDayClick,
}) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, index) => (
        <Day
          key={`${day.day}-${index}`}
          classNames={day.classNames}
          day={day}
          onHover={onHover}
          onClick={onDayClick}
        />
      ))}
    </div>
  );
};

const generateDays = (year: number, month: number): DayType[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days: DayType[] = [];

  // 前月の日付を追加
  for (let i = 0; i < startingDay; i++) {
    days.push({
      day: `-${startingDay - i}`,
      classNames: "bg-zinc-700/20",
    });
  }

  // 当月の日付を追加
  for (let i = 1; i <= daysInMonth; i++) {
    const hasReports = Math.random() < 0.3;
    const reportCount = hasReports ? Math.floor(Math.random() * 5) + 1 : 0;
    const industry = ["鉄鋼", "医薬", "航空", "自動車", "電機", "化学", "金融"][Math.floor(Math.random() * 7)];
    days.push({
      day: i.toString().padStart(2, '0'),
      classNames: "bg-[#1e1e1e]",
      reports: hasReports ? Array(reportCount).fill(null).map((_, index) => ({
        name: `${industry}企業${index + 1}`,
        industry,
        time: `${13 + index}:00`,
      })) : undefined,
    });
  }

  // 翌月の日付を追加
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: `+${i}`,
      classNames: "bg-zinc-700/20",
    });
  }

  return days;
};

const FinancialReportCalendar: React.FC = () => {
  const [hoveredDay, setHoveredDay] = useState<DayType | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayType | null>(null);

  const handleDayHover = useCallback((day: DayType | null, ref: React.RefObject<HTMLDivElement> | null) => {
    setHoveredDay(day);
  }, []);

  const handleDayClick = useCallback((day: DayType) => {
    setSelectedDay(day);
  }, []);

  const months = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  const changeMonth = (increment: number) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const days = useMemo(() => generateDays(currentYear, currentMonth), [currentYear, currentMonth]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 flex justify-center relative">
      <div className="w-full flex justify-center">
        <motion.div
          className="w-full max-w-md"
          animate={{ 
            x: selectedDay ? "-25%" : "0%",
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeMonth(-1)}
                className="text-zinc-300 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="text-zinc-300 hover:text-white"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <h2 className="text-2xl font-bold tracking-wider text-zinc-300">
              {currentYear}年{months[currentMonth]}
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
              <div
                key={day}
                className="text-xs text-white text-center bg-[#323232] py-1 px-0.5 rounded-xl"
              >
                {day}
              </div>
            ))}
          </div>
          <CalendarGrid onHover={handleDayHover} days={days} onDayClick={handleDayClick} />
        </motion.div>
      </div>
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            className="w-full max-w-md absolute left-1/2 top-0"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: "25%" }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-zinc-800 rounded-lg p-4 ml-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  {currentYear}年{months[currentMonth]}{selectedDay.day}日の財務報告
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-zinc-300 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                {selectedDay.reports?.map((report, index) => (
                  <div key={index} className="mb-4 p-3 bg-zinc-700 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-2">{report.name}</h4>
                    <p className="text-zinc-300">業種: {report.industry}</p>
                    <p className="text-zinc-300">発表時間: {report.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hoveredDay && hoveredDay.reports && hoveredDay.reports.length > 0 && !selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bg-zinc-800 rounded-lg p-4 shadow-lg w-64 z-10"
            style={{
              top: "0",
              right: "-280px",
            }}
          >
            <h3 className="text-lg font-bold text-white mb-2">
              {currentYear}年{months[currentMonth]}{hoveredDay.day}日の財務報告
            </h3>
            <ul>
              {hoveredDay.reports.map((report, index) => (
                <li key={index} className="text-zinc-300 mb-1">
                  {report.name} - {report.time}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialReportCalendar;
