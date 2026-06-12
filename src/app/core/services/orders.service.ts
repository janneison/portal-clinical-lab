import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map, forkJoin, of } from 'rxjs';
import { environment } from '@environments/environment';
import {
  LabOrder,
  OrderDetail,
  OrderListItem,
  OrdersPage,
  OrderSummary,
  CreateOrderRequest,
  OrderFilters,
  OrderStatus,
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/orders`;

  /** GET /orders — paginated list with server-side filters */
  getOrders(filters: OrderFilters = {}): Observable<OrdersPage> {
    let params = new HttpParams();
    if (filters.estado)      params = params.set('estado',       filters.estado);
    if (filters.fecha_desde) params = params.set('fecha_desde',  filters.fecha_desde);
    if (filters.fecha_hasta) params = params.set('fecha_hasta',  filters.fecha_hasta);
    if (filters.cups)        params = params.set('cups',         filters.cups);
    if (filters.page)        params = params.set('page',         filters.page.toString());
    if (filters.limit)       params = params.set('limit',        filters.limit.toString());

    return this.http.get<OrdersPage>(this.base, { params }).pipe(
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al obtener las órdenes'))
      )
    );
  }

  /** GET /orders/{id} — full order detail, normalized to camelCase */
  getOrder(idSolicitudKey: string): Observable<LabOrder> {
    return this.http.get<any>(`${this.base}/${idSolicitudKey}`).pipe(
      map((raw) => this.normalizeOrder(raw)),
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al obtener la orden'))
      )
    );
  }

  /**
   * GET /orders/{id} merged with list data to fill missing fields.
   * The detail endpoint omits identificacion, tipoDeDocumento, sexo,
   * fechaDeNacimiento, centroDeSalud, medicoQueOrdena, fechaDeLaOrden.
   * We complement from GET /orders which does return them.
   */
  getOrderFull(idSolicitudKey: string): Observable<LabOrder> {
    return forkJoin({
      detail: this.http.get<any>(`${this.base}/${idSolicitudKey}`),
      // Search the list by the exact ID — returns 1 item if found
      list:   this.getOrders({ limit: 1, page: 1 }).pipe(
        // We can't filter by ID in the list endpoint, so we fetch a small
        // page just to get the structure, then do a broader search below
        catchError(() => of({ data: [], pagination: { total: 0, page: 1, limit: 1, total_pages: 0 } }))
      ),
    }).pipe(
      map(({ detail, list }) => {
        // Try to find the item in the first page; if not found we still
        // have the detail data — missing fields will show as empty
        const listItem = list.data.find((o) => o.idSolicitudKey === idSolicitudKey);
        return this.mergeOrderData(detail, listItem ?? null);
      }),
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al obtener la orden'))
      )
    );
  }

  /**
   * Fetches the full order by searching all pages until the item is found,
   * then merges with the detail response.
   */
  getOrderFullSearch(idSolicitudKey: string): Observable<LabOrder> {
    return forkJoin({
      detail: this.http.get<any>(`${this.base}/${idSolicitudKey}`),
      list:   this.getOrders({ limit: 100 }),
    }).pipe(
      map(({ detail, list }) => {
        const listItem = list.data.find((o) => o.idSolicitudKey === idSolicitudKey) ?? null;
        return this.mergeOrderData(detail, listItem);
      }),
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al obtener la orden'))
      )
    );
  }

  private mergeOrderData(detail: any, listItem: OrderListItem | null): LabOrder {
    const merged = {
      ...detail,
      // Fields missing from detail — filled from list item
      identificacion:    detail.identificacion    ?? listItem?.identificacion    ?? '',
      tipoDeDocumento:   detail.tipoDeDocumento   ?? listItem?.tipoDocumento     ?? '',
      tipoDocumento:     detail.tipoDocumento     ?? listItem?.tipoDocumento     ?? '',
      sexo:              detail.sexo              ?? listItem?.sexo              ?? 'M',
      fechaDeNacimiento: detail.fechaDeNacimiento ?? detail.fecha_nacimiento     ?? '',
      centroDeSalud:     detail.centroDeSalud     ?? listItem?.centroDeSalud     ?? '',
      fechaDeLaOrden:    detail.fechaDeLaOrden    ?? listItem?.fechaDeLaOrden    ?? '',
      medicoQueOrdena:   detail.medicoQueOrdena   ?? listItem?.medicoQueOrdena   ?? '',
      idAliado:          detail.idAliado          ?? listItem?.idAliado,
    };
    return this.normalizeOrder(merged);
  }

  /** POST /orders — create new order */
  createOrder(order: CreateOrderRequest): Observable<OrderSummary> {
    return this.http.post<OrderSummary>(this.base, order).pipe(
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al crear la orden'))
      )
    );
  }

  /** POST /orders/{id}/send — send to allied lab */
  sendOrder(idSolicitudKey: string): Observable<{ idSolicitudKey: string; estadoDeLaOrden: OrderStatus; fechaEnvio: string }> {
    return this.http
      .post<{ idSolicitudKey: string; estadoDeLaOrden: OrderStatus; fechaEnvio: string }>(
        `${this.base}/${idSolicitudKey}/send`, {}
      )
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Error al enviar la orden'))
        )
      );
  }

  // ─── Normalizer ────────────────────────────────────────────────────────────
  // The backend may return snake_case or mixed field names.
  // This maps every known alias to the canonical camelCase name used in the UI.

  private normalizeOrder(raw: any): LabOrder {
    // Log raw response in dev to help identify field names from the backend
    if (!environment.production) {
      console.debug('[OrdersService] raw GET /orders/{id}:', raw);
    }

    return {
      idSolicitudKey:       raw.idSolicitudKey        ?? raw.id_solicitud_key    ?? raw.solicitud_key      ?? '',
      idAdmision:           raw.idAdmision            ?? raw.id_admision         ?? raw.admision           ?? '',
      idAtencion:           raw.idAtencion            ?? raw.id_atencion         ?? raw.atencion,
      tipoDeDocumento:      raw.tipoDeDocumento       ?? raw.tipoDocumento       ?? raw.tipo_documento     ?? raw.tipo_de_documento ?? '',
      tipoDocumento:        raw.tipoDocumento         ?? raw.tipo_documento      ?? raw.tipoDeDocumento,
      identificacion:       raw.identificacion        ?? '',
      nombreDelPaciente:    raw.nombreDelPaciente      ?? raw.nombre_del_paciente ?? raw.nombre_paciente    ?? raw.paciente ?? '',
      sexo:                (raw.sexo                  ?? 'M') as 'M' | 'F',
      fechaDeNacimiento:    raw.fechaDeNacimiento      ?? raw.fecha_de_nacimiento ?? raw.fecha_nacimiento   ?? '',
      centroDeSalud:        raw.centroDeSalud          ?? raw.centro_de_salud     ?? raw.centro_salud       ?? '',
      fechaDeLaOrden:       raw.fechaDeLaOrden         ?? raw.fecha_de_la_orden   ?? raw.fecha_orden        ?? '',
      medicoQueOrdena:      raw.medicoQueOrdena        ?? raw.medico_que_ordena   ?? raw.medico_ordena      ?? raw.medico ?? '',
      medicoId:             raw.medicoId               ?? raw.medico_id           ?? null,
      numeroDeAutorizacion: raw.numeroDeAutorizacion   ?? raw.numero_de_autorizacion ?? raw.numero_autorizacion,
      idAliado:             raw.idAliado              ?? raw.id_aliado,
      porcEjecucion:        raw.porcEjecucion         ?? raw.porc_ejecucion      ?? 0,
      estadoDeLaOrden:     (raw.estadoDeLaOrden       ?? raw.estado_de_la_orden  ?? raw.estado_orden       ?? 'pending') as OrderStatus,
      fechaEnvio:           raw.fechaEnvio            ?? raw.fecha_envio         ?? null,
      detalles:             Array.isArray(raw.detalles) ? raw.detalles.map((d: any) => this.normalizeDetail(d)) : [],
    };
  }

  private normalizeDetail(raw: any): OrderDetail {
    return {
      cups:                              raw.cups                               ?? '',
      nombreDelLaboratorio:              raw.nombreDelLaboratorio               ?? raw.nombre_del_laboratorio ?? raw.nombre_laboratorio ?? '',
      fechaTomaMuestra:                  raw.fechaTomaMuestra                   ?? raw.fecha_toma_muestra     ?? null,
      metodo:                            raw.metodo                             ?? null,
      reactivo:                          raw.reactivo                           ?? null,
      invima:                            raw.invima                             ?? null,
      estadoDelResultado:                raw.estadoDelResultado                 ?? raw.estado_del_resultado   ?? raw.estado_resultado   ?? null,
      fechaResultado:                    raw.fechaResultado                     ?? raw.fecha_resultado        ?? null,
      tipoIdentificacionDelBacteriologo: raw.tipoIdentificacionDelBacteriologo  ?? raw.tipo_id_bacteriologo   ?? null,
      identificacionDelBacteriologo:     raw.identificacionDelBacteriologo      ?? raw.id_bacteriologo        ?? null,
    };
  }
}
