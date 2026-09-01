# Órbita — Preguntas abiertas

Registro de decisiones pendientes de la lluvia de ideas.
Última actualización: 27/08/2026

Plan de negocio completo: `orbita-plan-negocio.html`
Versión publicada: https://claude.ai/code/artifact/548fa2ac-c2c8-4689-ac58-0d1eebf4d86f
Preguntas dirigidas a vos: `cuestionario.md`

---

## Bloqueantes — resolver antes de tocar dinero real

### 1. Consulta legal formal
Nada del encuadre del §01 sustituye asesoría profesional. Hay que validar con un
despacho especializado en regulación financiera mexicana:

- Si la estructura auto-custodial efectivamente evita el Art. 103 LIC (captación
  irregular de recursos).
- Qué obligaciones de PLD/KYC aplican a Órbita bajo la Ley Fintech en su
  apartado de activos virtuales.
- Si el Fondo de Protección, tal como está diseñado, puede describirse sin caer
  en actividad aseguradora regulada.
- **Pregunta específica levantada el 27/08:** ¿existe una vía para acreditar el
  rendimiento al usuario y cobrar una tarifa de gestión declarada, sin que eso
  reintroduzca el perfil de "pagar intereses a depositantes"? Es un intercambio,
  no una salida gratis — hay que preguntarlo, no asumirlo.

**Por qué bloquea:** define si el proyecto es viable sin licencia de IFPE
(≈35 millones de pesos de capital mínimo).

### 2. Liquidez real de MXNe en Stellar
**La pregunta de moneda quedó resuelta en estructura (ver Decisiones tomadas),
pero depende de un dato que falta verificar.**

Hallazgo del 27/08: **Blend soporta USDC, XLM, EURC y AQUA — no pesos.**
Existe **MXNe** en Stellar (emisor: Brale, desde 2024), pero no genera
rendimiento. Ahorrar en pesos ⇒ fondo sin rendimiento, financiado solo por
comisión.

Pendiente de verificar antes de fijar el default en pesos:

- Profundidad de liquidez real de MXNe en Stellar.
- Qué anchors mexicanos la operan y con qué fricción de entrada/salida a pesos.
- Costo real del anchor en rampa MXN fiat ↔ MXNe (el margen de ~$405 por
  círculo está estimado, no cotizado).

**Por qué bloquea:** si MXNe no tiene liquidez usable, el default en pesos no es
viable y habría que revisar toda la postura de moneda.

Comparación calculada (círculo 15 × $600):

| | Círculo en MXNe | Círculo en USDC |
|---|---|---|
| Riesgo cambiario del usuario | Ninguno | Lo asume el usuario |
| Rendimiento en Blend | Cero | $233.65 |
| Aporte al fondo | $270 (comisión, permanente) | $233.65 (rendimiento) |
| Cobertura sobre pérdida esperada | 12.9× | 11.1× |
| **Neto para Órbita** | **~$1,384.74** | **$2,059.74** |

---

## Decisiones de modelo

### 3. Meta del Fondo de Protección
Definimos la cascada (capitalización → apagado del 20% de comisión → baja de
comisión al usuario) pero falta el número.

Propuesto: 12 meses de pérdida esperada de la cartera activa. **Sin validar.**

Falta además el piso: qué pasa con la cobertura del 70% si el rendimiento de
Blend se desploma y el fondo cae bajo cierto umbral. Tiene que estar escrito en
el contrato antes del piloto, no después.

### 4. ¿Se permiten círculos chicos y cortos?
El caso de 5 personas × $300 × 5 semanas deja ≈$5 MXN en el primer círculo
(KYC completo) y ≈$105 en los siguientes.

Postura propuesta: permitirlo como **producto de adquisición**, no promoverlo
como caso principal, y medirlo como CAC.

**Métrica de guardia pendiente de adoptar:** el promedio de
`aporte al fondo ÷ pérdida potencial` de todos los círculos activos debe
mantenerse **≥ 1.0**. Referencias calculadas:

- Círculo 15 × $600 × 15 sem → 1.20
- Círculo 5 × $300 × 5 sem → 0.13

Si el promedio baja de 1.0: subir comisión en círculos cortos o ajustar
cobertura para ese segmento.

### 5. ¿1% es el precio correcto?
Costo total al usuario: 2.00% (1% comisión + 0.5% margen de entrada + 0.5% de
salida). Barato frente a un prestamista informal al 20% mensual; caro frente a
un cuaderno que no cobra nada.

**El competidor real es el papel, no otra fintech.** Requiere prueba de
disposición a pagar en campo antes de fijarlo.

### 6. ¿Alguien elegirá poner garantía?
El flujo modelado muestra que para un usuario nuevo casi nunca conviene:
inmovilizar $1,200 adelanta el cobro solo dos semanas. Eso resolvió la barrera
de entrada, pero deja la duda de si el carril con garantía tendrá demanda real
o si todos los círculos se llenarán solo con posiciones por reputación.

### 7. Recuperación de deuda fuera de la red
La deuda on-chain funciona como disuasivo dentro de Órbita, pero no hay vía
práctica de cobro fuera. Postura propuesta: asumir el incumplimiento como
pérdida y dimensionar el fondo en consecuencia, en vez de diseñar una cobranza
que no se va a poder ejecutar. **Falta confirmarlo como decisión.**

---

## Definiciones pendientes

### 8. Contexto de presentación
Sin definir. Las opciones cambian el énfasis, no la dirección:

- **Hackathon** → la Fase 1 es el entregable completo y suficiente.
- **Aceleradora / SCF Build Award** (hasta 150,000 USD en XLM) → se aplica con
  Fase 1 terminada y Fase 2 como uso declarado de fondos.

### 9. El nombre
"Órbita" es propuesta, no decisión. Restricciones de lenguaje que sí están
fijas:

- Nunca "tanda" ni "cundina" — estigma de las advertencias de Condusef.
- Nunca "caja de ahorro" — connotación regulatoria (sociedades cooperativas de
  ahorro y préstamo).
- Nunca "seguro" para el Fondo de Protección — actividad regulada.
- Sí "círculo de ahorro".

### 10. Proveedor de KYC
Sin elegir. Impacta directo la unidad económica: a $20 MXN por usuario, el KYC
se come el 28% del ingreso bruto en círculos chicos.

### 11. Destino del excedente del fondo
Ya hay recomendación (apagar el 20% de comisión al llegar a la meta, luego bajar
comisión al usuario, nunca retiro por parte de Órbita). **Falta adoptarla
formalmente** y escribirla en T&C, porque el saldo del fondo es visible on-chain
y los usuarios lo van a ver crecer.

---

## Decisiones ya tomadas

Para que no se relitiguen:

- **Auto-custodia como requisito estructural**, no elección estética. Es lo que
  hace legal al producto.
- **Órbita no paga rendimiento a los usuarios.** La garantía vuelve íntegra.
- **100% del rendimiento de garantías va al Fondo de Protección.** Órbita no
  puede retirarlo en ningún caso — es la evidencia de que no hay intermediación.
- **20% de la comisión al fondo** durante la fase de capitalización. Esa
  comisión sí es de Órbita y puede recuperarla al apagar el aporte.
- **Sin margen cambiario sobre la garantía**, ni al entrar ni al salir.
- **El tipo de cambio se muestra explícito** con el margen declarado en pantalla.
- **Usuarios nuevos entran por el camino sin garantía** (posición tardía,
  primera semana = una cuota + margen).
- **Cobertura del fondo parcial y con tope**: 70% de la cuota incumplida,
  máximo dos eventos por círculo.
- **Los círculos se forman entre gente que ya se conoce.** Órbita amplifica
  confianza preexistente; no la fabrica entre desconocidos.
- **La denominación es propiedad del círculo, no del usuario.** No puede haber
  monedas mixtas dentro de un mismo círculo: si el tipo de cambio se mueve
  durante el ciclo, quien cobra temprano y quien cobra tarde reciben valores
  reales distintos y se rompe la equivalencia aporte/cobro.
- **La elige el organizador al crear el círculo**, visible para todos antes de
  sumarse. Default: **MXNe**. Dólares como opción explícita con advertencia de
  riesgo cambiario, no en letra chica.
- **El Fondo de Protección es uno solo y global**, no uno por círculo. Los
  círculos en dólares aportan rendimiento que protege también a los de pesos.
- **En círculos en pesos el aporte del 20% de comisión es permanente** — no hay
  apagado porque no hay rendimiento que lo reemplace.
- **La app nunca debe insinuar que el dólar va a subir.**

---

## Cola de trabajo

Pendiente de redactar en el plan de negocio:

1. **Modelo de gastos operativos y punto de equilibrio.** Alcance acordado con
   el usuario: equipo = una sola persona (sin sueldo modelado por ahora),
   servidores e infraestructura, asesorías, soporte a usuarios y adquisición.
   Es la pieza más grande que le falta al plan — una aceleradora va a preguntar
   por el opex y el burn.
2. **Política del Fondo**: la cascada completa (capitalización → apagado →
   baja de comisión → nunca retiro por Órbita) y la lista de cláusulas de T&C.
3. **Comparación de tamaños de círculo** (15 × $600 vs 5 × $300) con la métrica
   de guardia ≥ 1.0.
4. **Sección de moneda**: denominación por círculo, default MXNe, y la tabla
   comparativa de las dos configuraciones.
