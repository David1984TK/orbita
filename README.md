# Órbita

Ahorro colaborativo para trabajadores informales en LatAm, sobre Stellar y
Soroban. El dinero vive en un contrato cuyas reglas de liberación se escriben
antes del primer depósito; la plataforma nunca lo custodia.

**Estado:** sin código todavía. Fase de diseño.

---

## Stack previsto

| Capa | Tecnología |
|---|---|
| Contratos | Soroban (Rust) |
| Autenticación | Passkeys / smart wallets de Stellar — sin frase semilla |
| Rendimiento | Blend |
| Rampa fiat | Anchors de Stellar |
| Cliente | Móvil |

## Estructura prevista

```
contracts/     Contratos Soroban
  circulo/     Ciclo de aportes, turnos y liberación
  garantia/    Colateral y cálculo de exposición neta
  reputacion/  Score no transferible
  fondo/       Fondo de Protección
app/           Cliente móvil
```

## Lógica central

El contrato controla cuánto podría llevarse alguien si desapareciera hoy:

```
exposición neta = recibido − aportado − garantía
regla:           exposición neta ≤ límite(score)
```

De ahí salen la posición en la rueda y el colateral exigido: quien no tiene
historial cobra tarde o deposita garantía; quien lo tiene cobra temprano sin
depositar nada.

## Desarrollo

Pendiente de definir. Todo el trabajo inicial va contra **testnet**, sin dinero
real, hasta contar con opinión legal por escrito.

---

La documentación de negocio no se versiona acá — vive fuera del repo.
