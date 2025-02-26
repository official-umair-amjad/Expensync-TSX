"use client";
import { useState, useEffect } from "react";

interface CurrencyConverterProps {
  totalExpense: number;
}

export default function ExpenseDisplay({ totalExpense }: CurrencyConverterProps) {
  const [currency, setCurrency] = useState<string>("USD");
  const [rate, setRate] = useState<number>(1);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch(
          `https://openexchangerates.org/api/latest.json?app_id=${process.env.NEXT_PUBLIC_OER_APP_ID}`
        );
        const data = await res.json();
        if (data?.rates?.[currency]) {
          setRate(data.rates[currency]);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    }
    fetchRate();
  }, [currency]);

  const convertedExpense = totalExpense * rate;

  return (
    <div className="flex gap-4 items-center">

      <div className="bg-green-600 text-2xl text-white font-bold px-4 py-2 rounded">
        Total: {convertedExpense.toFixed(2)} {currency}
      </div>

      <select
        className="mt-2 p-1 border rounded text-xs"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
        <option value="USD">USD - US Dollar</option>
        <option value="PKR">PKR - Pakistani Rupee</option>
        <option value="INR">INR - Indian Rupee</option>
        <option value="EUR">EUR - Euro</option>
        <option value="JPY">JPY - Japanese Yen</option>
        <option value="GBP">GBP - British Pound</option>
        <option value="AUD">AUD - Australian Dollar</option>
        <option value="CAD">CAD - Canadian Dollar</option>
        <option value="CHF">CHF - Swiss Franc</option>
        <option value="CNY">CNY - Chinese Yuan</option>
        <option value="SEK">SEK - Swedish Krona</option>
        <option value="NZD">NZD - New Zealand Dollar</option>
      </select>


    </div>
  );
}
