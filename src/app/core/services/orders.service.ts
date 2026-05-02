import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  LabOrder,
  OrderListItem,
  OrdersPage,
  OrderSummary,
  CreateOrderRequest,
  OrderFilters,
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/orders`;

  /**
   * GET /orders — lista paginada con filtros del servidor
   */
  getOrders(filters: OrderFilters = {}): Observable<OrdersPage> {
    let params = new HttpParams();

    if (filters.estado)      params = params.set('estado', filters.estado);
    if (filters.fecha_desde) params = params.set('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params = params.set('fecha_hasta', filters.fecha_hasta);
    if (filters.cups)        params = params.set('cups', filters.cups);
    if (filters.page)        params = params.set('page', filters.page.toString());
    if (filters.limit)       params = params.set('limit', filters.limit.toString());

    return this.http.get<OrdersPage>(this.base, { params }).pipe(
      catchError((err) => {
        const message = err.error?.error ?? 'Error al obtener las órdenes';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * GET /orders/{id} — detalle completo de una orden
   */
  getOrder(idSolicitudKey: string): Observable<LabOrder> {
    return this.http.get<LabOrder>(`${this.base}/${idSolicitudKey}`).pipe(
      catchError((err) => {
        const message = err.error?.error ?? 'Error al obtener la orden';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * POST /orders — crear nueva orden
   */
  createOrder(order: CreateOrderRequest): Observable<OrderSummary> {
    return this.http.post<OrderSummary>(this.base, order).pipe(
      catchError((err) => {
        const message = err.error?.error ?? 'Error al crear la orden';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * POST /orders/{id}/send — enviar al laboratorio aliado
   */
  sendOrder(idSolicitudKey: string): Observable<{ idSolicitudKey: string; estadoDeLaOrden: string; fechaEnvio: string }> {
    return this.http
      .post<{ idSolicitudKey: string; estadoDeLaOrden: string; fechaEnvio: string }>(
        `${this.base}/${idSolicitudKey}/send`,
        {}
      )
      .pipe(
        catchError((err) => {
          const message = err.error?.error ?? 'Error al enviar la orden';
          return throwError(() => new Error(message));
        })
      );
  }
}
