import { Calendar as CalendarIcon } from 'lucide-react';

const Calendar = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 text-sm">Schedule your study sessions</p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-dashed border-orange-200 p-12 lg:p-16 text-center">
        <CalendarIcon className="w-14 h-14 text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-500 text-sm">
          Google Calendar integration for scheduling study sessions
        </p>
      </div>
    </div>
  );
};

export default Calendar;
