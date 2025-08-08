export function pushall(sequence_id: string) {
  return {
    "pushing": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "pushall",
      "version": 1,
      "push_target": 1
    }
  }
}

export function get_version(sequence_id: string) {
  return {
    "info": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "get_version"
    }
  }
}

export function stop_print(sequence_id: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "stop",
      "param": ""
    }
  }
}

export function pause_print(sequence_id: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "pause",
      "param": ""
    }
  }
}

export function resume_print(sequence_id: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "resume",
      "param": ""
    }
  }
}

export function calibration(sequence_id: string, option: number) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "calibration",
      "option": option
    }
  }
}

export function print_speed(sequence_id: string, param: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "print_speed",
      "param": param
    }
  }
}

export function skip_objects(sequence_id: string, obj_list: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "skip_objects",
      "obj_list": obj_list
    }
  }
}

export function print_file(sequence_id: string, param: string, url: string, timelapse: boolean, bed_levelling: boolean, flow_cali: boolean, vibration_cali: boolean, layer_inspect: boolean, ams_mapping: string, use_ams: boolean) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "project_file",
      "param": param,
      "project_id": "0",
      "profile_id": "0",
      "task_id": "0",
      "subtask_id": "0",
      "subtask_name": "",
      "file": "",
      "url": url,
      "md5": "",
      "timelapse": timelapse,
      "bed_type": "auto",
      "bed_levelling": bed_levelling,
      "flow_cali": flow_cali,
      "vibration_cali": vibration_cali,
      "layer_inspect": layer_inspect,
      "ams_mapping": ams_mapping,
      "use_ams": use_ams
    }
  }
}

export function gcode_file(sequence_id: string, param: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "gcode_file",
      "param": param
    }
  }
}

export function gcode_line(sequence_id: string, param: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "gcode_line",
      "param": param
    }
  }
}

export function ams_settings(sequence_id: string, ams_id: number, startup_read_option: string, tray_read_option: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "ams_user_setting",
      "ams_id": ams_id,
      "startup_read_option": startup_read_option,
      "tray_read_option": tray_read_option
    }
  }
}

export function ams_filament(sequence_id: string, ams_id: number, tray_id: number, tray_color: string, nozzle_temp_min: number, nozzle_temp_max: number, tray_type: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "ams_filament_setting",
      "ams_id": ams_id,
      "tray_id": tray_id,
      "tray_info_idx": "",
      "tray_color": tray_color,
      "nozzle_temp_min": nozzle_temp_min,
      "nozzle_temp_max": nozzle_temp_max,
      "tray_type": tray_type
    }
  }
}

export function ams_change_filament(target: number, curr_temp: number, tar_temp: number) {
  return {
    "print": {
        "sequence_id": "0",
        "command": "ams_change_filament",
        "target": target,
        "curr_temp": curr_temp,
        "tar_temp": tar_temp
    }
  }
}

export function filament_load() {
  return ams_change_filament(255, 250, 250);
}

export function filament_unload(sequence_id: string) {
  return {
    "print": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "unload_filament"
    }
  }
}

export function nozzle_settings(nozzle_diameter: string, nozzle_type: string) {
  return {
    "system": {
      "accessory_type": "nozzle",
      "command": "set_accessories",
      "nozzle_diameter": parseFloat(nozzle_diameter),
      "nozzle_type": nozzle_type
    }
  }
}

export function led_control(sequence_id: string, led_node: string, led_mode: string) {
  return {
    "system": {
      "sequence_id": (parseInt(sequence_id) + 1).toString(),
      "command": "ledctrl",
      "led_node": led_node,
      "led_mode": led_mode,
      "led_on_time": "500",
      "led_off_time": "500",
      "loop_times": "1",
      "interval_time": "1000"
    }
  }
}

export function temp_bed(sequence_id: string, param: string) {
  return gcode_line((parseInt(sequence_id) + 1).toString(), `M140 S${param}`)
}

export function temp_nozzle(sequence_id: string, param: string) {
  return gcode_line((parseInt(sequence_id) + 1).toString(), `M104 S${param}`)
}

export function part_fan_speed(sequence_id: string, speed: string) {
  console.log( gcode_line((parseInt(sequence_id) + 1).toString(), `M106 P1 S${speed}`))
  return gcode_line((parseInt(sequence_id) + 1).toString(), `M106 P1 S${speed}\n`);
}

export function auto_home(sequence_id: string) {
  return gcode_line((parseInt(sequence_id) + 1).toString(), "G28")
}

export function power_loss_recovery(on: boolean) {
  return `M1003 S${on? '1' : '2'}`
}

export function firmware_update() {
  return {
    "upgrade": {
        "command": "upgrade_confirm",
        "src_id": 1,
    }
  }
}

export async function sendCommand(slug: string, host: string, password: string, serial: string, payload: any) {
  try {
    const res = await fetch(`/api/printers/${slug}/mqtt/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host,
        password,
        serial,
        payload
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to send command');
    }

    const data = await res.json();
    return {
      success: true,
      message: 'successfully sent command',
      data
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}