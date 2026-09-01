# Órbita

Ahorro colaborativo para trabajadores informales en LatAm, construido sobre
Stellar y Soroban.

> La plataforma nunca toca el dinero — y por eso puede existir.

**Estado:** fase de diseño. No hay código todavía; el trabajo actual es el plan
de negocio y la validación del problema.

---

## El problema

Las tandas —ahorro rotativo entre conocidos— funcionan en toda Latinoamérica,
pero dependen de que una persona custodie el dinero de todos. Ese es el punto
donde se rompen: el fraude del organizador es la razón principal por la que la
gente les tiene miedo.

En México hay un agravante regulatorio. Participar en una tanda es legal, pero
una plataforma que junte el dinero de sus usuarios cae en **captación irregular
de recursos** (Art. 103 de la Ley de Instituciones de Crédito), y la licencia
que lo habilitaría exige ~35 millones de pesos de capital mínimo.

## La solución

El dinero vive en un contrato Soroban cuyas reglas de liberación se escriben
antes del primer depósito, y cada usuario controla su propia llave mediante
passkey. Órbita provee software, no intermediación financiera.

La auto-custodia no es una elección estética: es la condición que hace viable al
producto.

### Cómo se sostiene la confianza

| Mecanismo | Qué resuelve |
|---|---|
| **Reputación portable** | Score on-chain no transferible; historial crediticio para quien nunca tuvo uno |
| **Exposición neta acotada** | `recibido − aportado − garantía ≤ límite(score)`. La posición en la rueda deja de ser sorteo y pasa a ser decisión de riesgo |
| **Fondo de Protección** | Cobertura parcial financiada por el rendimiento de las garantías, que Órbita no puede retirar |

### Accesibilidad

Móvil, con passkey (huella o Face ID) y sin frase semilla. El usuario nunca ve
las palabras *wallet*, *gas* ni *XLM* — ve pesos, una rueda con el turno de cada
quien, y un botón. Órbita patrocina las comisiones de red.

---

## Contenido del repo

| Archivo | Qué es |
|---|---|
| `orbita-plan-negocio.html` | Plan de negocio completo: encuadre legal, producto, arquitectura de confianza, unidad económica, diferenciación, go-to-market, roadmap y riesgos |
| `preguntas-abiertas.md` | Decisiones de modelo pendientes y registro de las ya tomadas |
| `cuestionario.md` | Preguntas de validación pendientes de responder |

El plan se lee mejor abriendo el HTML en el navegador.

---

## Stack previsto

- **Contratos:** Soroban (Rust)
- **Móvil:** passkeys / smart wallets sobre Stellar
- **Rendimiento:** Blend (protocolo de préstamos de Stellar)
- **Rampa fiat:** anchors de Stellar para entrada y salida a moneda local

## Roadmap

1. **Demo defendible** — ciclo completo en contrato, app móvil con passkey,
   testnet, sin dinero real
2. **Piloto cerrado** — opinión legal, integración con Blend y un anchor
   mexicano, KYC, 10–20 círculos reales
3. **Apertura** — score portable vía API, cooperativas y sindicatos, segundo
   país

Destino: [Stellar Community Fund](https://communityfund.stellar.org/) — Build
Award.

---

## Advertencia

El análisis regulatorio de este repo **no sustituye asesoría legal**. Debe
validarse con un despacho especializado en regulación financiera mexicana antes
de operar con dinero real.
