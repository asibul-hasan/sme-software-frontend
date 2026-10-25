import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SaleInvoicePrintData } from './print.service';

/**
 * WebUSB TypeScript Interface Declarations
 * Declared locally to guarantee 100% build compatibility across any TS configuration.
 */
export interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

export interface USBEndpoint {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous';
  packetSize: number;
}

export interface USBAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  interfaceName?: string;
  endpoints: USBEndpoint[];
}

export interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
  alternates: USBAlternateInterface[];
  claimed: boolean;
}

export interface USBConfiguration {
  configurationValue: number;
  configurationName?: string;
  interfaces: USBInterface[];
}

export interface USBOutTransferResult {
  bytesWritten: number;
  status: 'ok' | 'stall';
}

export interface USBDevice {
  vendorId: number;
  productId: number;
  manufacturerName?: string;
  productName?: string;
  serialNumber?: string;
  configuration: USBConfiguration | null;
  configurations: USBConfiguration[];
  opened: boolean;

  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource | Uint8Array | any): Promise<USBOutTransferResult>;

  // Compatibility properties for vendorID / productID variations
  vendorID?: number;
  productID?: number;
}

export interface USBConnectionEvent extends Event {
  device: USBDevice;
}

export interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
  addEventListener(type: string, listener: (ev: any) => void): void;
  removeEventListener(type: string, listener: (ev: any) => void): void;
}

declare global {
  interface Navigator {
    usb?: USB;
  }
}

export interface UsbPrinterDeviceInfo {
  vendorID: number;
  productID: number;
  name: string;
}

/**
 * UsbPrinterService
 * -----------------------------------------------------------------------------------------
 * Native WebUSB Direct Printing Service for Thermal POS Receipt Printers (ESC/POS).
 *
 * Features:
 * - Silent auto-reconnect to previously authorized USB receipt printers via localStorage
 * - Browser device picker (WebUSB) fallback for first-time pairing
 * - Dynamic bulk-OUT endpoint auto-detection
 * - Raw binary ESC/POS command stream support (initialization, line feed, paper cutting, cash drawer kick)
 * - Structured receipt text formatter for 80mm (42-48 cols) and 58mm (32 cols) rolls
 * - Angular Signals (`isConnected`, `deviceInfo`, `isSupported`) for reactive UI bindings
 * - BehaviorSubject `connectionStatus$` for backward RxJS compatibility
 */
@Injectable({
  providedIn: 'root',
})
export class UsbPrinterService {
  private device: USBDevice | null = null;
  private readonly isConnected$ = new BehaviorSubject<boolean>(false);
  private bulkOutEndpoint: number = 1;

  private readonly STORAGE_KEY = 'usb_printer_ids';

  // Observable for backward RxJS compatibility
  public readonly connectionStatus$: Observable<boolean> = this.isConnected$.asObservable();

  // Angular Signals for modern reactive templates
  public readonly isConnected = signal<boolean>(false);
  public readonly deviceInfo = signal<UsbPrinterDeviceInfo | null>(null);
  public readonly isSupported = signal<boolean>(typeof navigator !== 'undefined' && 'usb' in navigator);

  constructor() {
    this.initUsbEventListeners();
  }

  /**
   * Listen for hardware attach / detach events.
   */
  private initUsbEventListeners(): void {
    if (typeof navigator === 'undefined' || !navigator.usb) return;

    try {
      navigator.usb.addEventListener('disconnect', (event: any) => {
        const disconnectedDev = event?.device;
        if (this.device && disconnectedDev && this.isSameDevice(this.device, disconnectedDev)) {
          console.warn('[UsbPrinterService] Printer detached from USB port');
          this.handleDisconnectedState();
        }
      });

      navigator.usb.addEventListener('connect', async (event: any) => {
        const connectedDev = event?.device;
        const saved = this.loadDeviceIds();
        if (saved && connectedDev) {
          const vId = connectedDev.vendorID ?? connectedDev.vendorId;
          const pId = connectedDev.productID ?? connectedDev.productId;
          if (vId === saved.vendorID && pId === saved.productID) {
            console.log('[UsbPrinterService] Known printer re-attached. Auto-reconnecting...');
            await this.tryAutoConnect();
          }
        }
      });
    } catch (e) {
      console.warn('[UsbPrinterService] Could not register USB attach/detach listeners:', e);
    }
  }

  private isSameDevice(a: USBDevice, b: USBDevice): boolean {
    const aVid = a.vendorID ?? a.vendorId;
    const aPid = a.productID ?? a.productId;
    const bVid = b.vendorID ?? b.vendorId;
    const bPid = b.productID ?? b.productId;
    return aVid === bVid && aPid === bPid;
  }

  private handleConnectedState(device: USBDevice): void {
    this.device = device;
    const vId = device.vendorID ?? device.vendorId;
    const pId = device.productID ?? device.productId;
    const info: UsbPrinterDeviceInfo = {
      vendorID: vId,
      productID: pId,
      name: device.productName || 'USB Thermal Printer',
    };
    this.deviceInfo.set(info);
    this.isConnected.set(true);
    this.isConnected$.next(true);
  }

  private handleDisconnectedState(): void {
    this.device = null;
    this.deviceInfo.set(null);
    this.isConnected.set(false);
    this.isConnected$.next(false);
  }

  /**
   * Detects the bulk-OUT endpoint dynamically from interfaces & alternate settings.
   */
  private detectBulkOutEndpoint(): number {
    if (!this.device?.configuration) return 1;

    for (const iface of this.device.configuration.interfaces) {
      for (const alternate of iface.alternates) {
        for (const endpoint of alternate.endpoints) {
          if (endpoint.direction === 'out' && endpoint.type === 'bulk') {
            console.log(`[UsbPrinterService] Detected bulk-OUT endpoint: ${endpoint.endpointNumber}`);
            return endpoint.endpointNumber;
          }
        }
      }
    }

    console.warn('[UsbPrinterService] No bulk-OUT endpoint found, falling back to endpoint 1');
    return 1;
  }

  private saveDeviceIds(vendorID: number, productID: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ vendorID, productID }));
    } catch {
      // Ignore storage errors in private browsing
    }
  }

  private loadDeviceIds(): { vendorID: number; productID: number } | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  private clearDeviceIds(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Connects to printer: attempts silent auto-reconnect first; opens browser WebUSB picker if needed.
   */
  async connect(): Promise<void> {
    try {
      if (!this.isSupported()) {
        throw new Error('WebUSB is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Chromium on Windows/Linux/macOS.');
      }

      const isAutoConnected = await this.tryAutoConnect();
      if (isAutoConnected) return;

      this.device = await navigator.usb!.requestDevice({ filters: [] });

      if (!this.device) {
        throw new Error('Device selection cancelled or no USB printer found');
      }

      await this.openDevice();

      const vId = this.device.vendorID ?? this.device.vendorId;
      const pId = this.device.productID ?? this.device.productId;
      this.saveDeviceIds(vId, pId);
      this.handleConnectedState(this.device);
    } catch (error) {
      this.handleDisconnectedState();
      throw error;
    }
  }

  /**
   * Attempts silent auto-connect using previously granted permissions.
   */
  public async tryAutoConnect(): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.usb) {
        return false;
      }

      const saved = this.loadDeviceIds();
      const devices = await navigator.usb.getDevices();

      let authorizedDevice: USBDevice | undefined;

      if (saved) {
        authorizedDevice = devices.find((d) => {
          const vId = d.vendorID ?? d.vendorId;
          const pId = d.productID ?? d.productId;
          return vId === saved.vendorID && pId === saved.productID;
        });
      }

      if (!authorizedDevice && devices.length > 0) {
        authorizedDevice = devices[0];
      }

      if (!authorizedDevice) {
        return false;
      }

      this.device = authorizedDevice;

      try {
        await this.openDevice();
        const vId = authorizedDevice.vendorID ?? authorizedDevice.vendorId;
        const pId = authorizedDevice.productID ?? authorizedDevice.productId;
        this.saveDeviceIds(vId, pId);
        this.handleConnectedState(authorizedDevice);
        return true;
      } catch (openError) {
        this.device = null;
        return false;
      }
    } catch {
      return false;
    }
  }

  private async openDevice(): Promise<void> {
    if (!this.device) return;

    try {
      if (this.device.opened) {
        this.bulkOutEndpoint = this.detectBulkOutEndpoint();
        return;
      }

      await this.device.open();

      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }

      try {
        await this.device.claimInterface(0);
      } catch (interfaceError) {
        this.device = null;
        this.handleDisconnectedState();
        throw new Error('Device interface claim failed. Please reconnect printer or close other applications using this USB port.');
      }

      this.bulkOutEndpoint = this.detectBulkOutEndpoint();
    } catch (error) {
      this.device = null;
      this.handleDisconnectedState();
      throw error;
    }
  }

  /**
   * Sends raw binary buffer to printer bulk-OUT endpoint.
   */
  async printRaw(data: Uint8Array): Promise<void> {
    if (!this.device || !this.device.opened) {
      throw new Error('Printer not connected. Please connect USB printer first.');
    }

    try {
      const result = await this.device.transferOut(this.bulkOutEndpoint, data);

      if (result.status !== 'ok') {
        throw new Error(`Transfer failed with status: ${result.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Prints UTF-8 encoded text directly.
   */
  async print(data: string): Promise<void> {
    const encoder = new TextEncoder();
    await this.printRaw(encoder.encode(data));
  }

  /**
   * ESC/POS Paper Cut command: GS V 0 (0x1D 0x56 0x00)
   */
  async cut(): Promise<void> {
    if (!this.device || !this.device.opened) {
      throw new Error('Printer not connected. Please connect USB printer first.');
    }

    const cutCommand = new Uint8Array([0x1d, 0x56, 0x00]);
    await this.printRaw(cutCommand);
  }

  /**
   * ESC/POS Initialize command: ESC @ (0x1B 0x40)
   */
  async initialize(): Promise<void> {
    await this.printRaw(new Uint8Array([0x1b, 0x40]));
  }

  /**
   * ESC/POS Line Feed command: ESC d n (0x1B 0x64 n)
   */
  async feedLines(lines: number = 3): Promise<void> {
    const clampedLines = Math.min(255, Math.max(1, lines));
    await this.printRaw(new Uint8Array([0x1b, 0x64, clampedLines]));
  }

  /**
   * ESC/POS Cash Drawer Kick command: ESC p 0 25 250 (0x1B 0x70 0x00 0x19 0xFA)
   */
  async openCashDrawer(): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await this.printRaw(new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]));
    } catch (e) {
      console.warn('[UsbPrinterService] Could not kick cash drawer:', e);
    }
  }

  /**
   * Prints plain text receipt with initialization, trailing feed lines, and auto-cut.
   */
  async printReceipt(receiptText: string): Promise<void> {
    try {
      if (!this.isConnected()) {
        await this.connect();
      }

      await this.initialize();
      await this.print(receiptText);
      await this.feedLines(3);
      await this.cut();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Formats and prints a complete pharmacy sale tax invoice / receipt to the thermal printer.
   *
   * @param data SaleInvoicePrintData structure containing pharmacy info, bill no, lines, and payment totals.
   * @param rollType Roll width: '80mm' (default, 42 columns) or '58mm' (32 columns).
   * @param kickDrawer Optional flag to pulse the cash drawer kick if a cash tender was received.
   */
  async printSaleInvoice(
    data: SaleInvoicePrintData,
    rollType: '80mm' | '58mm' = '80mm',
    kickDrawer: boolean = false
  ): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const width = rollType === '58mm' ? 32 : 42;
    const divider = '-'.repeat(width);
    const doubleDivider = '='.repeat(width);

    const padLine = (left: string, right: string): string => {
      const combined = left.length + right.length;
      if (combined >= width) {
        const avail = width - right.length - 1;
        left = left.substring(0, Math.max(0, avail));
      }
      const spaces = Math.max(1, width - left.length - right.length);
      return left + ' '.repeat(spaces) + right;
    };

    const center = (text: string): string => {
      const trimmed = text.trim();
      if (trimmed.length >= width) return trimmed.substring(0, width);
      const pad = Math.floor((width - trimmed.length) / 2);
      return ' '.repeat(pad) + trimmed;
    };

    let receipt = '';

    // Header
    receipt += doubleDivider + '\n';
    if (data.branchName) receipt += center(data.branchName.toUpperCase()) + '\n';
    if (data.branchAddress) receipt += center(data.branchAddress) + '\n';
    if (data.branchPhone) receipt += center(`Hotline: ${data.branchPhone}`) + '\n';
    if (data.dlNumber || data.binNumber) {
      const dl = data.dlNumber ? `DL: ${data.dlNumber}` : '';
      const bin = data.binNumber ? `BIN: ${data.binNumber}` : '';
      const meta = [dl, bin].filter(Boolean).join(' | ');
      if (meta) receipt += center(meta) + '\n';
    }
    receipt += divider + '\n';

    // Metadata
    receipt += padLine('Bill No:', data.inv) + '\n';
    receipt += padLine('Date:', `${data.date}${data.time ? ' ' + data.time : ''}`) + '\n';
    receipt += padLine('Customer:', data.customer) + '\n';
    if (data.customerPhone) {
      receipt += padLine('Phone:', data.customerPhone) + '\n';
    }
    receipt += padLine('Served By:', data.salesman || 'Admin') + '\n';
    receipt += divider + '\n';

    // Table Header
    if (width === 32) {
      receipt += padLine('Item (Qty x Price)', 'Total') + '\n';
    } else {
      receipt += 'Item                       Qty   Price   Total\n';
    }
    receipt += divider + '\n';

    // Items
    for (const item of data.lines) {
      const priceStr = Number(item.price).toFixed(2);
      const totalStr = Number(item.total).toFixed(2);
      const qtyStr = String(item.qty);

      if (width === 32) {
        receipt += `${item.name}\n`;
        receipt += padLine(`  ${qtyStr} x ${priceStr}`, totalStr) + '\n';
      } else {
        const rightPart = `${qtyStr.padStart(5)} ${priceStr.padStart(7)} ${totalStr.padStart(7)}`;
        const maxNameLen = width - rightPart.length - 1;
        let name = item.name;
        if (name.length > maxNameLen) {
          name = name.substring(0, maxNameLen);
        }
        receipt += padLine(name, rightPart) + '\n';
      }

      if (item.batch || item.exp) {
        const b = [item.batch ? `Batch: ${item.batch}` : '', item.exp ? `Exp: ${item.exp}` : ''].filter(Boolean).join(' ');
        receipt += `  (${b})\n`;
      }
    }
    receipt += divider + '\n';

    // Summary
    receipt += padLine('Subtotal:', Number(data.subtotal).toFixed(2)) + '\n';
    if (data.disc && Number(data.disc) > 0) {
      receipt += padLine('Discount:', `-${Number(data.disc).toFixed(2)}`) + '\n';
    }
    if (data.vat && Number(data.vat) > 0) {
      receipt += padLine('VAT:', `+${Number(data.vat).toFixed(2)}`) + '\n';
    }
    receipt += divider + '\n';
    receipt += padLine('NET PAYABLE:', `TK ${Number(data.total).toFixed(2)}`) + '\n';
    receipt += padLine(`Paid (${data.paymentMethod || 'Cash'}):`, Number(data.paid).toFixed(2)) + '\n';
    if (data.due && Number(data.due) > 0) {
      receipt += padLine('DUE AMOUNT:', `TK ${Number(data.due).toFixed(2)}`) + '\n';
    }
    if (data.change && Number(data.change) > 0) {
      receipt += padLine('Change Due:', Number(data.change).toFixed(2)) + '\n';
    }
    receipt += divider + '\n';

    // Footer
    receipt += center('*** Thank You for Shopping! ***') + '\n';
    receipt += center('Medicines sold cannot be returned') + '\n';
    receipt += center('without receipt within 7 days.') + '\n';
    receipt += center('Generated by AidlyPms') + '\n';
    receipt += doubleDivider + '\n';

    // Print & Cut
    await this.initialize();
    await this.print(receipt);
    await this.feedLines(4);
    await this.cut();

    if (kickDrawer) {
      await this.openCashDrawer();
    }
  }

  /**
   * Disconnects the printer session.
   * @param clearSaved If true, removes saved device IDs from localStorage to stop auto-reconnecting.
   */
  async disconnect(clearSaved: boolean = false): Promise<void> {
    if (!this.device) return;

    try {
      if (this.device.opened) {
        try {
          await this.device.releaseInterface(0);
        } catch {}
        await this.device.close();
      }
      this.handleDisconnectedState();

      if (clearSaved) {
        this.clearDeviceIds();
      }
    } catch (error) {
      this.handleDisconnectedState();
      throw error;
    }
  }

  /**
   * Checks whether printer is currently connected and opened.
   */
  isConnectedDevice(): boolean {
    return this.device !== null && this.device.opened;
  }

  /**
   * Retrieves active device info or null.
   */
  getDeviceInfo(): UsbPrinterDeviceInfo | null {
    if (!this.device) return null;
    const vId = this.device.vendorID ?? this.device.vendorId;
    const pId = this.device.productID ?? this.device.productId;
    return {
      vendorID: vId,
      productID: pId,
      name: this.device.productName || 'USB Thermal Printer',
    };
  }
}
