import { format } from "util";

export function buildCommand(commandType: string, params: any = {}) {
  const template = COMMANDS[commandType as keyof typeof COMMANDS];
  if (!template) {
    console.error('command does not exist')
    return {};
  }
  
  const paramValues = Object.values(params);
  
  try {
    let command = JSON.stringify(template);

    paramValues.forEach((value, index) => {
      if (typeof value === "number") {
        command = command.replace('"%s"', String(value));
      } else {
        command = command.replace('"%s"', `"${value}"`);
      }
    });
    
    return JSON.parse(command);
  } catch (error) {
    console.error('error formatting command:', error);
    return template;
  }
}

export const COMMANDS = {
  pushall: {
    "pushing": {
      "sequence_id": "0",
      "command": "pushall",
      "version": 1,
      "push_target": 1
    }
  },
  get_version: {
    "info": {
      "sequence_id": "0",
      "command": "get_version"
    }
  },
  stop_print: {
    "print": {
      "sequence_id": "0",
      "command": "stop",
      "param": "",
    }
  },
  pause_print: {
    "print": {
      "sequence_id": "0",
      "command": "pause",
      "param": "",
    }
  },
  resume_print: {
    "print": {
      "sequence_id": "0",
      "command": "resume",
      "param": "",
    }
  },
  calibration: {
    "print": {
      "sequence_id": "0",
      "command": "calibration",
      "option": "%s"
    }
  },
  filament_load: {
    "print": {
      "command": "ams_change_filament",
      "target": 255,
      "curr_temp": 250,
      "tar_temp": 250
    }
  },
  filament_unload: {
    "print": {
      "sequence_id": "0",
      "command": "unload_filament"
    }
  },
  print_speed: {
    "print": {
      "sequence_id": "0",
      "command": "print_speed",
      "param": "%s"
    }
  },
  skip_objects: {
    "print": {
      "sequence_id": "0",
      "command": "skip_objects",
      "obj_list": "%s"
    }
  },
  print_file: {
    "print": {
      "sequence_id": "0",
      "command": "project_file",
      "param": "%s",
      "project_id": "0",
      "profile_id": "0",
      "task_id": "0",
      "subtask_id": "0",
      "subtask_name": "",
      "file": "",
      "url": "%s",
      "md5": "",
      "timelapse": "%s",
      "bed_type": "auto",
      "bed_levelling": "%s",
      "flow_cali": "%s",
      "vibration_cali": "%s",
      "layer_inspect": "%s",
      "ams_mapping": "%s",
      "use_ams": "%s"
    }
  },
  gcode_file: {
    "print": {
      "sequence_id": "0",
      "command": "gcode_file",
      "param": "%s"
    }
  },
  gcode_line: {
    "print": {
      "sequence_id": "0",
      "command": "gcode_line",
      "param": "%s"
    }
  },
  ams_settings: {
    "print": {
      "sequence_id": "0",
      "command": "ams_user_setting",
      "ams_id": "%s",
      "startup_read_option": "%s",
      "tray_read_option": "%s"
    }
  },
  ams_filament: {
    "print": {
      "sequence_id": "0",
      "command": "ams_filament_setting",
      "ams_id": "%s",
      "tray_id": "%s",
      "tray_info_idx": "",
      "tray_color": "%s",
      "nozzle_temp_min": "%s",
      "nozzle_temp_max": "%s",
      "tray_type": "%s"
    }
  },
  nozzle_settings: {
    "system": {
      "accessory_type": "nozzle",
      "command": "set_accessories",
      "nozzle_diameter": "%s",
      "nozzle_type": "%s"
    }
  },
  led_control: {
    "system": {
      "sequence_id": "0",
      "command": "ledctrl",
      "led_node": "%s",
      "led_mode": "%s",
      "led_on_time": "500",
      "led_off_time": "500",
      "loop_times": "1",
      "interval_time": "1000"
    }
  },
  temp_bed: {
    "print": {
      "sequence_id": "0",
      "command": "gcode_line",
      "param": "M140 %s"
    }
  },
  temp_nozzle: {
    "print": {
      "sequence_id": "0",
      "command": "gcode_line",
      "param": "M104 %s"
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