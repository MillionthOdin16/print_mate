import { NextRequest } from 'next/server';

interface PrintSpeedParams {
  speed: string;
}

interface SkipObjectsParams {
  obj_list: string[];
}

interface PrintFileParams {
  param: string;
  file: string;
  url: string;
  md5: string;
  bed_levelling?: boolean;
  flow_cali?: boolean;
  vibration_cali?: boolean;
  layer_inspect?: boolean;
  ams_mapping?: string;
  use_ams?: boolean;
}

interface GcodeFileParams {
  file: string;
}

interface GcodeLineParams {
  line: string;
}

interface AmsSettingsParams {
  ams_id: number;
  startup_read_option: boolean;
  tray_read_option: boolean;
}

function buildCommand(commandType: string, params: any = {}) {
  switch (commandType) {
    case 'print_speed':
      return {
        "print": {
          "sequence_id": "0",
          "command": "print_speed",
          "param": params.speed || "1"
        }
      };

    case 'skip_objects':
      return {
        "print": {
          "sequence_id": "0",
          "command": "skip_objects",
          "obj_list": params.obj_list || []
        }
      };

    case 'print_file':
      return {
        "print": {
          "sequence_id": "0",
          "command": "project_file",
          "param": params.param || "",
          "project_id": "0",
          "profile_id": "0",
          "task_id": "0",
          "subtask_id": "0",
          "subtask_name": "",
          "file": params.file || "",
          "url": params.url || "",
          "md5": params.md5 || "",
          "timelapse": true,
          "bed_type": "auto",
          "bed_levelling": params.bed_levelling !== undefined ? params.bed_levelling : true,
          "flow_cali": params.flow_cali !== undefined ? params.flow_cali : true,
          "vibration_cali": params.vibration_cali !== undefined ? params.vibration_cali : true,
          "layer_inspect": params.layer_inspect !== undefined ? params.layer_inspect : true,
          "ams_mapping": params.ams_mapping || "",
          "use_ams": params.use_ams !== undefined ? params.use_ams : false
        }
      };

    case 'gcode_file':
      return {
        "print": {
          "sequence_id": "0",
          "command": "gcode_file",
          "param": params.file || ""
        }
      };

    case 'gcode_line':
      return {
        "print": {
          "sequence_id": "0",
          "command": "gcode_line",
          "param": params.line || ""
        }
      };

    case 'ams_settings':
      return {
        "print": {
          "sequence_id": "0",
          "command": "ams_user_setting",
          "ams_id": params.ams_id !== undefined ? params.ams_id : 0,
          "startup_read_option": params.startup_read_option !== undefined ? params.startup_read_option : true,
          "tray_read_option": params.tray_read_option !== undefined ? params.tray_read_option : true
        }
      };

    default:
      return COMMANDS[commandType as keyof typeof COMMANDS] || {};
  }
}

const COMMANDS = {
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
        "command": "calibration"
    }
  },
  filament_load: {
    "print": {
        "sequence_id": "0",
        "command": "load"
    }
  },
  filament_unload: {
    "print": {
        "sequence_id": "0",
        "command": "unload_filament"
    }
  },
  led_control: {
    "system": {
        "sequence_id": "0",
        "command": "ledctrl",
        "led_node": "chamber_light",
        "led_mode": "on",
        "led_on_time": 500,
        "led_off_time": 500,
        "loop_times": 1,
        "interval_time": 1000
    }
  },
  get_accesscode: {
    "system": {
        "sequence_id": "0",
        "command": "get_access_code"
    }
  },
};

export async function GET(req: NextRequest) {
  try {
    return new Response(JSON.stringify({
      success: true,
      commands: Object.keys(COMMANDS),
      parametric_commands: [
        'print_speed',
        'skip_objects', 
        'print_file',
        'gcode_file',
        'gcode_line',
        'ams_settings'
      ]
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { host, password, serial, command, params } = await req.json();

    if (!host || !password || !serial || !command) {
      return new Response(JSON.stringify({
        success: false,
        error: 'missing values for host, password, serial, or command'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const commandPayload = buildCommand(command, params);
    
    if (!commandPayload || Object.keys(commandPayload).length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `command ${command} does not exist.`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await sendCommand(host, password, serial, commandPayload);
    
    return new Response(JSON.stringify(result), { 
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function sendCommand(host: string, password: string, serial: string, payload: any) {
  try {
    const publishUrl = `/api/printers/${serial}/mqtt/publish`;
    
    const response = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host,
        password,
        serial,
        payload: JSON.stringify(payload)
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'failed to send command'
      };
    }

    return {
      success: true,
      message: 'successfully sent command',
      data: result
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}