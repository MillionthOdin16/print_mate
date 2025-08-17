'use client';

import { createContext, ReactNode, useContext } from "react";

interface PrinterStateInfo {
  state: PrinterState;
  lastUpdated: number;
  subscribers: Set<string>;
}

class PrinterStateManager {
  private static instance: PrinterStateManager;
  private statePool: Map<string, PrinterStateInfo> = new Map();
  private updateCallbacks: Map<string, Map<string, (state: PrinterState) => void>> = new Map();

  private constructor() {
    setInterval(() => {
      this.cleanupInactiveStates();
    }, 10 * 60 * 1000); // 10m
  }

  static getInstance(): PrinterStateManager {
    if (!PrinterStateManager.instance) {
      PrinterStateManager.instance = new PrinterStateManager();
    }
    return PrinterStateManager.instance;
  }

  private getStateKey(host: string, serial: string): string {
    return `${host}:${serial}`;
  }

  getState(host: string, serial: string): PrinterState {
    const key = this.getStateKey(host, serial);
    const stateInfo = this.statePool.get(key);
    
    if (stateInfo) {
      stateInfo.lastUpdated = Date.now();
      return stateInfo.state;
    }

    const initialState: PrinterState = { print: {} };
    this.statePool.set(key, {
      state: initialState,
      lastUpdated: Date.now(),
      subscribers: new Set()
    });
    this.updateCallbacks.set(key, new Map());

    return initialState;
  }

  updateState(host: string, serial: string, data: Partial<PrinterState>): void {
    const key = this.getStateKey(host, serial);
    const stateInfo = this.statePool.get(key);

    if (stateInfo) {
      stateInfo.state = this.deepMerge(stateInfo.state, data);
      stateInfo.lastUpdated = Date.now();
    } else {
      this.statePool.set(key, {
        state: { print: {}, ...data },
        lastUpdated: Date.now(),
        subscribers: new Set()
      });
      this.updateCallbacks.set(key, new Map());
    }

    this.notifySubscribers(key);
  }

  subscribe(host: string, serial: string, subscriberId: string, callback: (state: PrinterState) => void): void {
    const key = this.getStateKey(host, serial);
    
    this.getState(host, serial);
    
    const stateInfo = this.statePool.get(key)!;
    stateInfo.subscribers.add(subscriberId);

    if (!this.updateCallbacks.has(key)) {
      this.updateCallbacks.set(key, new Map());
    }
    this.updateCallbacks.get(key)!.set(subscriberId, callback);

    callback(stateInfo.state);
  }

  unsubscribe(host: string, serial: string, subscriberId: string): void {
    const key = this.getStateKey(host, serial);
    const stateInfo = this.statePool.get(key);
    
    if (stateInfo) {
      stateInfo.subscribers.delete(subscriberId);
    }

    const callbacks = this.updateCallbacks.get(key);
    if (callbacks) {
      callbacks.delete(subscriberId);
    }
  }

  resetState(host: string, serial: string): void {
    const key = this.getStateKey(host, serial);
    const stateInfo = this.statePool.get(key);
    
    if (stateInfo) {
      stateInfo.state = { print: {} };
      stateInfo.lastUpdated = Date.now();
      this.notifySubscribers(key);
    }
  }

  removeState(host: string, serial: string): void {
    const key = this.getStateKey(host, serial);
    this.statePool.delete(key);
    this.updateCallbacks.delete(key);
  }

  getAllStates(): { [key: string]: PrinterState } {
    const states: { [key: string]: PrinterState } = {};
    for (const [key, stateInfo] of this.statePool) {
      states[key] = stateInfo.state;
    }
    return states;
  }

  getStateStats(): { [key: string]: { subscribers: number; lastUpdated: number } } {
    const stats: { [key: string]: { subscribers: number; lastUpdated: number } } = {};
    
    for (const [key, stateInfo] of this.statePool) {
      stats[key] = {
        subscribers: stateInfo.subscribers.size,
        lastUpdated: stateInfo.lastUpdated
      };
    }
    
    return stats;
  }

  private notifySubscribers(key: string): void {
    const stateInfo = this.statePool.get(key);
    const callbacks = this.updateCallbacks.get(key);
    
    console.log(`Notifying subscribers for ${key}:`, {
      hasStateInfo: !!stateInfo,
      hasCallbacks: !!callbacks,
      callbackCount: callbacks?.size || 0,
      currentState: stateInfo?.state
    });
    
    if (stateInfo && callbacks) {
      callbacks.forEach((callback, subscriberId) => {
        try {
          console.log(`Calling subscriber ${subscriberId} with state:`, stateInfo.state);
          callback(stateInfo.state);
        } catch (error) {
          console.error(`Error in state update callback for ${key}, subscriber ${subscriberId}:`, error);
        }
      });
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private cleanupInactiveStates(): void {
    const now = Date.now();
    const maxIdleTime = 60 * 60 * 1000;

    for (const [key, stateInfo] of this.statePool) {
      if (stateInfo.subscribers.size > 0) {
        continue;
      }

      if (now - stateInfo.lastUpdated > maxIdleTime) {
        console.log(`Cleaning up inactive printer state: ${key}`);
        this.removeState(...key.split(':') as [string, string]);
      }
    }
  }
}

interface PrinterContextType {
  manager: PrinterStateManager;
  getState: (host: string, serial: string) => PrinterState;
  updateState: (host: string, serial: string, data: Partial<PrinterState>) => void;
  subscribe: (host: string, serial: string, subscriberId: string, callback: (state: PrinterState) => void) => void;
  unsubscribe: (host: string, serial: string, subscriberId: string) => void;
}

export interface PrinterState {
  print: {
    ams?: {
      ams: Array<{
        humidity: string;
        id: string;
        temp: string;
        tray: Array<{
          id: string;
          bed_temp?: string;
          bed_temp_type?: string;
          cols?: string[];
          drying_temp?: string;
          drying_time?: string;
          nozzle_temp_max?: string;
          nozzle_temp_min?: string;
          remain?: number;
          tag_uid?: string;
          tray_color?: string;
          tray_diameter?: string;
          tray_id_name?: string;
          tray_info_idx?: string;
          tray_sub_brands?: string;
          tray_type?: string;
          tray_uuid?: string;
          tray_weight?: string;
          xcam_info?: string;
        }>;
      }>;
      ams_exist_bits?: string;
      insert_flag?: boolean;
      power_on_flag?: boolean;
      tray_exist_bits?: string;
      tray_is_bbl_bits?: string;
      tray_now?: string;
      tray_pre?: string;
      tray_read_done_bits?: string;
      tray_reading_bits?: string;
      tray_tar?: string;
      version?: number;
    };
    ams_rfid_status?: number;
    ams_status?: number;
    aux_part_fan?: boolean;
    bed_target_temper?: number;
    bed_temper?: number;
    big_fan1_speed?: string;
    big_fan2_speed?: string;
    chamber_temper?: number;
    command?: string;
    cooling_fan_speed?: string;
    fail_reason?: string;
    fan_gear?: number;
    filam_bak?: any[];
    force_upgrade?: boolean;
    gcode_file?: string;
    gcode_file_prepare_percent?: string;
    gcode_start_time?: string;
    gcode_state?: string;
    heatbreak_fan_speed?: string;
    hms?: any[];
    home_flag?: number;
    hw_switch_state?: number;
    ipcam?: {
      ipcam_dev: string;
      ipcam_record: string;
      resolution: string;
      timelapse: string;
    };
    layer_num?: number;
    lifecycle?: string;
    lights_report?: Array<{
      mode: string;
      node: string;
    }>;
    maintain?: number;
    mc_percent?: number;
    mc_print_error_code?: string;
    mc_print_stage?: string;
    mc_print_sub_stage?: number;
    mc_remaining_time?: number;
    mess_production_state?: string;
    nozzle_diameter?: string;
    nozzle_target_temper?: number;
    nozzle_temper?: number;
    online?: {
      ahb: boolean;
      rfid: boolean;
      version: number;
    };
    print_error?: number;
    print_gcode_action?: number;
    print_real_action?: number;
    print_type?: string;
    profile_id?: string;
    project_id?: string;
    queue_number?: number;
    sdcard?: boolean;
    sequence_id?: string;
    spd_lvl?: number;
    spd_mag?: number;
    stg?: any[];
    stg_cur?: number;
    subtask_id?: string;
    subtask_name?: string;
    task_id?: string;
    total_layer_num?: number;
    upgrade_state?: {
      ahb_new_version_number: string;
      ams_new_version_number: string;
      consistency_request: boolean;
      dis_state: number;
      err_code: number;
      force_upgrade: boolean;
      message: string;
      module: string;
      new_version_state: number;
      ota_new_version_number: string;
      progress: string;
      sequence_id: number;
      status: string;
    };
    upload?: {
      file_size: number;
      finish_size: number;
      message: string;
      oss_url: string;
      progress: number;
      sequence_id: string;
      speed: number;
      status: string;
      task_id: string;
      time_remaining: number;
      trouble_id: string;
    };
    vt_tray?: {
      bed_temp: string;
      bed_temp_type: string;
      cols: string[];
      drying_temp: string;
      drying_time: string;
      id: string;
      nozzle_temp_max: string;
      nozzle_temp_min: string;
      remain: number;
      tag_uid: string;
      tray_color: string;
      tray_diameter: string;
      tray_id_name: string;
      tray_info_idx: string;
      tray_sub_brands: string;
      tray_type: string;
      tray_uuid: string;
      tray_weight: string;
      xcam_info: string;
    };
    wifi_signal?: string;
    xcam?: {
      allow_skip_parts: boolean;
      buildplate_marker_detector: boolean;
      first_layer_inspector: boolean;
      halt_print_sensitivity: string;
      print_halt: boolean;
      printing_monitor: boolean;
      spaghetti_detector: boolean;
    };
    xcam_status?: string;
  };
  event: {
    event: string,
    disconnected_at: string,
    connected_at: string,
  };
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export function PrinterStateProvider({ children }: { children: ReactNode }) {
  const manager = PrinterStateManager.getInstance();

  const getState = (host: string, serial: string) => manager.getState(host, serial);
  const updateState = (host: string, serial: string, data: Partial<PrinterState>) => manager.updateState(host, serial, data);
  const subscribe = (host: string, serial: string, subscriberId: string, callback: (state: PrinterState) => void) => manager.subscribe(host, serial, subscriberId, callback);
  const unsubscribe = (host: string, serial: string, subscriberId: string) => manager.unsubscribe(host, serial, subscriberId);

  return (
    <PrinterContext.Provider value={{
      manager,
      getState,
      updateState,
      subscribe,
      unsubscribe
    }}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinterState() {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinterState must be used within a PrinterStateProvider');
  }
  return context;
}

export default PrinterStateManager.getInstance();