# Órbita — Cuestionario pendiente

Preguntas que necesito que respondas para seguir. Cada una cambia algo concreto
del diseño o del plan; ninguna es de relleno.

Complemento de `preguntas-abiertas.md` (decisiones de modelo) y
`orbita-plan-negocio.html` (el plan completo).

Última actualización: 27/08/2026

---

## 🔴 Lo primero — validación del problema

Estas van antes que todas las demás. Si las respuestas son "no", conviene saberlo
ahora y no después de escribir contratos.

1. **¿Hablaste con alguien que participe en tandas reales sobre esta idea?**
   ¿Qué te dijeron?
2. **¿El fraude del organizador es realmente el problema principal**, o lo
   asumimos nosotros? Todo el producto está construido sobre esa premisa.
3. ¿Conocés personalmente a algún organizador de tandas? ¿Cuántos?
4. ¿Vos participaste alguna vez en una? ¿Cómo fue la experiencia?
5. Si alguien te dijera "prefiero mi cuaderno, es gratis y funciona",
   ¿qué le responderías?

---

## Sobre vos y tu capacidad

6. ¿En qué país estás? (Cambia el marco legal, el go-to-market y qué anchors
   podés usar.)
7. ¿Cuántas horas por semana le podés dedicar? Define si la Fase 1 en 4–6
   semanas es realista o fantasía.
8. **¿Sabés Rust?** Soroban se escribe en Rust. Si no, ¿estás dispuesto a
   aprenderlo, o buscarías cofundador técnico?
9. ¿Tenés experiencia previa con React Native / desarrollo móvil?
10. ¿Tenés capital propio para el piloto? ¿Cuánto podés poner sin grant?
11. ¿Ya sos embajador de Stellar / BAF, o tendrías que aplicar?
12. ¿Tenés entidad legal constituida? ¿En qué país?
13. ¿Presentás solo o pensás sumar a alguien?

---

## Divisas y rieles

14. **¿Los usuarios que imaginás tienen cuenta bancaria?** Muchos trabajadores
    informales no. Si no la tienen, el cash-out no puede ser transferencia
    bancaria y todo el diseño de salida cambia.
15. ¿El retiro debe ser a cuenta bancaria, efectivo en corresponsal
    (OXXO, farmacias), o ambos?
16. ¿Tenés cuenta en algún exchange o anchor mexicano (Bitso u otro)?
17. ¿Conocés a alguien que haya usado MXNe en Stellar? Necesito saber si tiene
    liquidez real antes de fijarla como default.
18. **Si MXNe resulta no tener liquidez usable, ¿qué preferís?**
    (a) Arrancar en USDC con advertencias claras de riesgo cambiario
    (b) Esperar a que mejore el riel en pesos
    (c) Buscar otro riel o anchor
19. ¿Querés soportar las dos monedas desde el día uno, o arrancar solo con una
    para simplificar el piloto?
20. ¿Te parece bien que los círculos en dólares subsidien el fondo de los
    círculos en pesos? (Es lo que propone el diseño actual.)

---

## Mecánica del producto

21. ¿Tamaño mínimo y máximo de círculo? (Modelamos 5 y 15; ¿hay tope?)
22. **¿Solo cuota semanal, o también quincenal y mensual?** Muchas tandas son
    quincenales porque se alinean con las quincenas de pago. Puede importar más
    que el semanal.
23. ¿Qué pasa si alguien quiere salir a mitad del círculo por una emergencia?
24. ¿Un usuario puede tener más de un círculo activo al mismo tiempo?
25. ¿El organizador tiene privilegios especiales? ¿Puede expulsar a alguien?
26. ¿El organizador cobra algo por armar el círculo? (Hoy el modelo dice que no.)
27. ¿Qué pasa si el organizador abandona a mitad del ciclo?
28. **¿Cómo se asigna exactamente el orden de cobro** entre quienes califican
    para la misma posición? ¿Sorteo, orden de llegada, o subasta?
29. ¿Los miembros pueden ver el score de los demás antes de entrar al círculo?
    (Ayuda a la confianza, pero es dato personal.)
30. ¿Se puede invitar a alguien sin score al círculo, o hace falta un mínimo?

---

## Notificaciones y accesibilidad

31. **¿Push, SMS o WhatsApp?** En México WhatsApp es dominante y probablemente
    supere al SMS para esta población. Cambia el costo por usuario y la
    integración.
32. ¿Qué pasa con alguien que cambia de teléfono? La passkey vive en el
    dispositivo — hay que definir el flujo de recuperación, y es crítico para
    esta base de usuarios.
33. ¿Contemplamos que alguien no tenga smartphone y opere a través del
    organizador? (Era la idea original de "agente de confianza".)

---

## Riesgo y Fondo de Protección

34. ¿La meta del fondo en cuántos meses de pérdida esperada? (Propuse 12.)
35. ¿La cobertura del 70% es el número que querés, o preferís otro?
36. ¿Dos eventos cubiertos por círculo es el tope correcto?
37. **¿Qué pasa si el fondo se agota?** ¿Se suspenden círculos nuevos, baja la
    cobertura, o se cubre parcial hasta donde alcance?
38. ¿Adoptamos la métrica de guardia (aporte al fondo ÷ pérdida potencial ≥ 1.0)
    como regla formal?
39. ¿Permitimos círculos chicos y cortos aunque casi no dejen margen, tratándolos
    como producto de adquisición?

---

## Legal y cumplimiento

40. ¿Tenés presupuesto para el despacho especializado? ¿De cuánto?
41. **¿Estás dispuesto a operar solo en testnet, sin dinero real, hasta tener la
    opinión legal por escrito?** Es mi recomendación fuerte.
42. ¿Querés que prepare el listado de preguntas concretas para llevarle al
    abogado?
43. ¿Qué proveedor de KYC te resulta accesible? El costo por usuario impacta
    directo la unidad económica.
44. ¿Cómo manejamos a un menor de edad o alguien sin identificación oficial?
    Es común en economía informal.

---

## Go-to-market

45. ¿Qué ciudad o región para el piloto?
46. ¿Tenés acceso a alguna cooperativa, sindicato, mercado o central de abasto?
47. ¿Podés conseguir 2 o 3 organizadores reales para un piloto de prueba?
48. ¿Cuántos círculos te parece realista correr en los primeros tres meses?

---

## Presentación y alcance

49. **¿Hay una fecha límite concreta?** ¿Un hackathon con convocatoria abierta,
    o una fecha de aplicación al SCF?
50. ¿La presentación va en español o en inglés? Las aplicaciones al SCF son en
    inglés — si vas por ahí, hay que traducir todo el plan.
51. ¿Querés apuntar a la aceleradora primero y al SCF después, o directo al SCF?
52. ¿Necesitás pitch deck además del plan escrito? Son formatos distintos.
53. **¿Te quedás con el nombre "Órbita"?** Si no, conviene cambiarlo ahora,
    antes de que esté en todos lados.

---

## Alcance del modelo de gastos

Ya me diste el alcance (equipo = vos solo, más servidores, asesorías, soporte y
adquisición). Para armarlo me faltan números:

54. ¿Te ponés sueldo en el modelo, aunque sea simbólico? Un jurado suele
    preguntar cómo te sostenés vos.
55. ¿Presupuesto mensual estimado para servidores e infraestructura?
56. ¿La asesoría legal es un costo único de arranque o un retainer mensual?
57. ¿Cómo pensás dar soporte — WhatsApp, teléfono, dentro de la app? Define si
    escala o no.
58. ¿Adquisición es solo tu tiempo yendo a mercados, o contemplás pagarle a los
    organizadores por traer grupos?
