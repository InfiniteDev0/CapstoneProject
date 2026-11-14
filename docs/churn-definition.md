# Churn: the definition we use

**Churn** = a customer who used to buy from LuxuryShop and has stopped.
To turn that into something a model can learn, we fix three things: a cut-off date, a waiting window, and who counts.

## The timeline

```
 first day of history                cut-off (T)                    today
 ─────────────●────────────────────────────●───────────────────────────●──►
              │◄──── what the model may SEE ────►│◄── what it must PREDICT ──►│
                   (orders, clicks, devices,          60 days: did they buy
                    reviews, profile)                  again or not?
```

| Thing | Value |
|---|---|
| **Cut-off date T** | today − 60 days (the generator prints it, e.g. 2026-09-15) |
| **Outcome window** | the 60 days after T: `(T, today]` |
| **Who counts (eligible)** | customers who signed up before T **and** made at least one paid purchase before T |
| **Churned = 1** | no paid purchase in the outcome window |
| **Active = 0** | at least one paid purchase in the outcome window |
| **"Paid purchase"** | an order whose status is PAID, PROCESSING, SHIPPED or DELIVERED (cancelled and refunded orders don't count) |

New customers who joined after T, and people who never bought before T, are left out: you can't stop buying if you never started.

With the current practice data (seed 42): **358 eligible customers, 174 churned (about 49%), 116 of them faders**.

## The golden rule: no data leakage

> **Data leakage** is like getting tomorrow's newspaper while being asked to predict tomorrow's weather. You'd look brilliant in class and be useless in real life.

So every **feature** (input) is computed **only from things that happened before T**:

| ✅ Allowed (before T) | ❌ Not allowed (leaks the answer) |
|---|---|
| days since last order **as of T** | `users.last_login_at` (it keeps updating after T) |
| number of orders / money spent before T | order counts or totals that include orders after T |
| visits, views, bag adds, searches before T | clicks after T |
| trend: activity in the last 30 days before T vs. the 30 before that | product ratings recomputed with later reviews |
| tenure at T, devices seen before T, age, country | the persona file (`ml/data/generated/personas.csv`): it's the answer key, for checking only |

## How it is used

- **Phase 6 (training):** features from before T, labels from the 60 days after T. Train on some customers, test on others it has never seen, and report Accuracy, Precision, Recall and ROC-AUC.
- **Phase 7 (live):** the same features computed up to **today**, predicting the next 60 days. The admin sees each customer's risk as High / Medium / Low.

## Where the pattern comes from (for the report)

The practice-data generator gives about a quarter of customers a hidden "fader" card: they start visiting less 1–4 months before T and stop completely after it. Other customers can also go quiet just by chance. The model never sees the cards; it has to recognise the slowing-down behaviour, just as it would with real customers.
