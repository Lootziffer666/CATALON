# API Gateway / API Management Evaluation for CATALON

## CATALON capability needs (prioritized)

1. Deterministic policy gates (scope, authz, rate limit) for executor endpoints.
2. Low-latency routing for preview/composition APIs.
3. Dynamic config reloads (no downtime while evolving gates).
4. Good OSS operability (dashboards, CRDs, observability, plugins).
5. Optional full lifecycle management (developer portal, versioning) later.

## Shortlist recommendation

### Immediate fit (gateway-first)
- **Apache APISIX**: strongest dynamic config + high performance + plugin model.
- **Kong Gateway**: largest ecosystem and mature operational docs.
- **Tyk OSS**: balanced performance and friendly dashboard, good GraphQL story.

### Kubernetes-heavy alternative
- **Gloo Edge** or **Traefik** when Envoy/K8s-native workflows dominate.

### Full lifecycle candidate (phase 2)
- **Gravitee.io** if event-native APIs become first-class.
- **WSO2 API Manager** for strict enterprise governance.

## Tool-by-tool feature-fit

| Tool | CATALON fit | Why |
|---|---|---|
| Kong Gateway | High | Mature plugin ecosystem for auth, transform, rate limits. |
| Apache APISIX | Very High | Dynamic config and strong performance for real-time preview pipelines. |
| KrakenD | Medium | Excellent speed, but weaker lifecycle/governance feature depth. |
| Tyk | High | Good OSS UX + GraphQL + policy controls. |
| Traefik | Medium | Great ingress/service discovery, weaker API product features. |
| WSO2 API Manager | Medium | Strong lifecycle governance, heavier operational footprint. |
| Gravitee.io | High | Event-native strengths align with async agent workflows. |
| Apiman | Medium | Flexible enterprise platform but smaller momentum. |
| Fusio | Low-Medium | Fast API exposure, limited for advanced gateway governance needs. |
| API Umbrella | Medium | Multi-tenant strength, but smaller modern cloud-native momentum. |
| Gloo Edge | High | Envoy-native advanced routing/extensibility in K8s. |
| Ambassador Edge Stack | Medium-High | Developer GitOps focus; good K8s platform fit. |
| Ocelot | Low-Medium | Good only for .NET-centric stacks. |
| Spring Cloud Gateway | Medium | Strong for Java/Spring estates, less stack-neutral. |
| Express Gateway | Medium | Flexible for Node-centric teams, less enterprise depth. |

## Practical rollout for CATALON

1. Start with **APISIX** in front of `/compose`, `/preview`, `/execute`.
2. Enforce deterministic policies:
   - Path-scope allowlist for executor operations.
   - Signed approval token for execution mutations.
   - Rate limits per workspace and per model endpoint.
3. Add observability gates (latency/error budget) before self-healing auto-actions.
4. Re-evaluate full lifecycle platform once external developer onboarding is required.
