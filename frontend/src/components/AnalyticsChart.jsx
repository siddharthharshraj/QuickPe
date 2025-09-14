import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const MonthlyTrendsChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                />
                <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                    formatter={(value, name) => [`₹${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Spending']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Bar dataKey="income" fill="#10b981" name="income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spending" fill="#ef4444" name="spending" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const NetFlowChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                />
                <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Net Flow']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Line 
                    type="monotone" 
                    dataKey="netFlow" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#8b5cf6' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export const CategoryPieChart = ({ data }) => {
    const COLORS = [
        '#f97316', // orange
        '#3b82f6', // blue  
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#ef4444', // red
        '#10b981', // emerald
        '#06b6d4', // cyan
        '#6366f1', // indigo
        '#64748b'  // slate
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="totalAmount"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    formatter={(value, name, props) => [
                        `₹${value.toLocaleString()}`, 
                        `${props.payload.name} (${props.payload.percentage}%)`
                    ]}
                    contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export const SavingsRateChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                />
                <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Savings Rate']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Line 
                    type="monotone" 
                    dataKey="savingsRate" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

// Default export - using the first chart component as default
export default MonthlyTrendsChart;
