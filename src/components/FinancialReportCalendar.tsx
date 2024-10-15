import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface CalendarData {
  date: string;
  count: string;
  details: CompanyReport[];
}

interface CompanyReport {
  銘柄名: string;
  コード: string;
  発表日: string;
  決算期: string;
  区分: string;
  通期予想: string;
  実績: string;
  進捗率: string;
  決算短信: string;
  発表状態: string;
}

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: DayType | null, ref: React.RefObject<HTMLDivElement> | null) => void;
  onClick: (day: DayType) => void;
  isSelected: boolean;
  isToday: boolean;
}

type DayType = {
  day: string;
  classNames: string;
  reports?: CompanyReport[];
};

const Day: React.FC<DayProps> = ({ classNames, day, onHover, onClick, isSelected, isToday }) => {
  const dayRef = useRef<HTMLDivElement>(null);
  const dayClass = isSelected ? 'selected-day' : isToday ? 'today' : '';
  return (
    <motion.div
      ref={dayRef}
      className={`relative flex items-center justify-center ${classNames} ${day.reports && day.reports.length > 0 ? 'cursor-pointer' : ''} ${dayClass}`}
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

const CalendarGrid: React.FC<{ onHover: (day: DayType | null, ref: React.RefObject<HTMLDivElement> | null) => void; days: DayType[]; onDayClick: (day: DayType) => void; selectedDay: DayType | null; currentDate: Date; }> = ({
  onHover,
  days,
  onDayClick,
  selectedDay,
  currentDate,
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
          isSelected={selectedDay?.day === day.day}
          isToday={day.day === currentDate.getDate().toString().padStart(2, '0') && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()}
        />
      ))}
    </div>
  );
};

const generateDays = (year: number, month: number, calendarData: CalendarData[]): DayType[] => {
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
    const currentDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const dayData = calendarData.find(data => data.date === currentDate);
    days.push({
      day: i.toString().padStart(2, '0'),
      classNames: "bg-[#1e1e1e]",
      reports: dayData ? dayData.details : undefined,
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
const ReportItem: React.FC<{ report: CompanyReport }> = ({ report }) => {
  return (
    <div className="mb-4 p-3 bg-zinc-700 rounded-lg">
      <h4 className="text-lg font-semibold text-white mb-2">{report.銘柄名}</h4>
      <p className="text-zinc-300">コード: {report.コード}</p>
      <p className="text-zinc-300">決算期: {report.決算期}</p>
      <p className="text-zinc-300">区分: {report.区分}</p>
      <p className="text-zinc-300">通期予想: {report.通期予想}</p>
      <p className="text-zinc-300">
        実績: <span dangerouslySetInnerHTML={{ __html: report.実績 }} />
      </p>
      <p className="text-zinc-300">進捗率: {report.進捗率}%</p>
      {report.決算短信 && (
        <a href={report.決算短信} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          決算短信
        </a>
      )}
    </div>
  );
};
const FinancialReportCalendar: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [hoveredDay, setHoveredDay] = useState<DayType | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayType | null>(null);
  const [currentDate] = useState(new Date());
  const [hoverCardPosition, setHoverCardPosition] = useState({ top: 0, left: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/data/calendar_202410.json')
      .then(response => response.json())
      .then(data => setCalendarData(Array.isArray(data) ? data : [data]))
      .catch(error => console.error('Error loading calendar data:', error));
  }, []);
  const days = useMemo(() => generateDays(currentYear, currentMonth, calendarData), [currentYear, currentMonth, calendarData]);
  
  useEffect(() => {
    if (currentDate.getMonth() === currentMonth && currentDate.getFullYear() === currentYear) {
      const todayDay = days.find(day => day.day === currentDate.getDate().toString().padStart(2, '0'));
      if (todayDay && todayDay.reports && todayDay.reports.length > 0) {
        setSelectedDay(todayDay);
      }
    }
  }, [currentMonth, currentYear, days, currentDate]);

  const handleDayHover = useCallback((day: DayType | null, ref: React.RefObject<HTMLDivElement> | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (day && ref && ref.current && day.reports && day.reports.length > 0) {
      const rect = ref.current.getBoundingClientRect();
      const calendarRect = ref.current.closest('.calendar-container')?.getBoundingClientRect();
      if (calendarRect) {
        setHoverCardPosition({
          top: rect.top - calendarRect.top,
          left: rect.right - calendarRect.left
        });
      }
      setHoveredDay(day);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHoveringCard) {
          setHoveredDay(null);
        }
      }, 100);
    }
  }, [isHoveringCard]);

  const handleDayClick = useCallback((day: DayType) => {
    if (day.reports && day.reports.length > 0) {
      setSelectedDay(day);
      setHoveredDay(null);
    }
  }, []);

  const months = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 flex justify-center relative calendar-container">
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
          <CalendarGrid onHover={handleDayHover} days={days} onDayClick={handleDayClick} selectedDay={selectedDay} currentDate={currentDate} />
        </motion.div>
      </div>
      <AnimatePresence>
        {selectedDay && selectedDay.reports && selectedDay.reports.length > 0 && (
          <motion.div
            className="w-full max-w-md absolute left-1/2"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: "25%" }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-zinc-800 rounded-lg p-4 ml-8 border border-gray-600">
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
                {selectedDay.reports.map((report, index) => (
                  <ReportItem key={index} report={report} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hoveredDay && hoveredDay.reports && hoveredDay.reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute bg-zinc-800 rounded-lg p-4 shadow-lg w-64 z-10 tips-today"
            style={{
              top: `${hoverCardPosition.top}px`,
              left: `${hoverCardPosition.left + 10}px`,
              maxHeight: '200px',
              overflowY: 'auto'
            }}
            onMouseEnter={() => setIsHoveringCard(true)}
            onMouseLeave={() => {
              setIsHoveringCard(false);
              handleDayHover(null, null);
            }}
          >
            <ul className="space-y-2">
              {hoveredDay.reports.map((report, index) => (
                <li key={index} className="text-zinc-300">
                  <p className="font-semibold">{report.銘柄名}（{report.コード}）</p>
                  <p className="text-sm">決算期: {report.決算期}</p>
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
