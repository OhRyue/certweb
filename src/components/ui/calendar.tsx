"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayFlag, DayPicker, SelectionState, UI } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        // 전체 레이아웃
        [UI.Months]: "flex flex-col sm:flex-row gap-2",
        [UI.Month]: "flex flex-col gap-4",
        [UI.MonthCaption]: "flex justify-center pt-1 relative items-center w-full",
        [UI.CaptionLabel]: "text-sm font-medium",

        // 네비게이션 버튼
        [UI.Nav]: "flex items-center gap-1",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1",
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1",
        ),

        // 달력 테이블
        [UI.MonthGrid]: "w-full border-collapse",

        // ✅ 요일 헤더 (여기가 지금 깨지는 부분)
        [UI.Weekdays]: "grid grid-cols-7 w-full",
        [UI.Weekday]:
          "text-muted-foreground rounded-md font-normal text-[0.8rem] flex items-center justify-center",

        // 주 단위 행 + 날짜 셀
        [UI.Week]: "grid grid-cols-7 w-full mt-2",
        [UI.Day]: cn(
          "relative p-0 text-center text-sm flex items-center justify-center h-9",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-accent",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),

        // 날짜 버튼
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),

        // 선택/범위/상태 플래그
        [SelectionState.range_start]:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        [SelectionState.range_end]:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        [SelectionState.selected]:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        [SelectionState.range_middle]:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",

        [DayFlag.today]: "bg-accent text-accent-foreground",
        [DayFlag.outside]:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        [DayFlag.disabled]: "text-muted-foreground opacity-50",
        [DayFlag.hidden]: "invisible",

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation = "left", className, ...rest }) => {
          if (orientation === "right") {
            return (
              <ChevronRight
                className={cn("h-4 w-4", className)}
                {...rest}
              />
            );
          }
          return (
            <ChevronLeft
              className={cn("h-4 w-4", className)}
              {...rest}
            />
          );
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
