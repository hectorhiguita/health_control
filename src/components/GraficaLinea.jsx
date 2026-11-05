import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import { C, FONT_DATA } from "../tokens";
import { Tarjeta, Etiqueta } from "./ui";

export default function GraficaLinea({ titulo, datos, llave, umbralAlarma, umbralPrecaucion, unidad, dominio }) {
  const conDato = datos.filter((d) => d[llave] !== null && d[llave] !== undefined);
  if (conDato.length < 2) return null;

  return (
    <Tarjeta>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <Etiqueta style={{ marginBottom: 2 }}>{titulo}</Etiqueta>
          <span style={{ fontFamily: FONT_DATA, fontSize: 11, color: C.ink40 }}>{unidad}</span>
        </div>
        <span style={{ fontFamily: FONT_DATA, fontSize: 10, color: C.crimson, letterSpacing: "0.08em" }}>
          ALARMA ≤ {umbralAlarma}
        </span>
      </div>
      <div style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={conDato} margin={{ top: 5, right: 24, left: -18, bottom: 0 }}>
            <ReferenceArea y1={dominio[0]} y2={umbralAlarma} fill={C.crimson} fillOpacity={0.07} />
            <ReferenceArea y1={umbralAlarma} y2={umbralPrecaucion} fill={C.amber} fillOpacity={0.07} />
            <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }}
              axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis domain={dominio} tick={{ fontSize: 10, fill: C.ink40, fontFamily: FONT_DATA }}
              axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: C.surface, border: `1px solid ${C.line}`,
                borderRadius: 2, fontFamily: FONT_DATA, fontSize: 12,
              }}
              formatter={(v) => [`${v} ${unidad}`, titulo]}
            />
            <ReferenceLine y={umbralAlarma} stroke={C.crimson} strokeWidth={1} strokeDasharray="4 3" />
            <Line type="monotone" dataKey={llave} stroke={C.slate} strokeWidth={2}
              dot={{ r: 3.5, fill: C.slate, strokeWidth: 0 }} activeDot={{ r: 5, fill: C.ink }}
              isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  );
}
