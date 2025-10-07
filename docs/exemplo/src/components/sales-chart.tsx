import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 2000 },
  { month: "Apr", sales: 2780 },
  { month: "May", sales: 1890 },
  { month: "Jun", sales: 2390 },
  { month: "Jul", sales: 3490 },
];

export function SalesChart() {
  return (
    <Card className="h-[400px]">
      <CardHeader>Sales Overview</CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#006FEE" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}