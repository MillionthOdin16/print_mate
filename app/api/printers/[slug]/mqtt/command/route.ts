import { NextRequest } from 'next/server';
import mqttManager from '@/lib/mqtt';
import { format } from "util";

function buildCommand(commandType: string, params: any = {}) {
  const template = COMMANDS[commandType as keyof typeof COMMANDS];
  if (!template) {
    return {};
  }
  
  const commandStr = JSON.stringify(template);
  const paramValues = Object.values(params);
  console.debug(paramValues);
  
  try {
    let formattedStr = format(commandStr, ...paramValues);
    console.debug('sending command:', formattedStr);
    return JSON.parse(formattedStr);
  } catch (error) {
    console.error('error formatting command:', error);
    return template;
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
      "file": "%s",
      "url": "%s",
      "md5": "%s",
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
        'ams_settings',
        'led_control'
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
    const { slug, host, password, serial, command, params } = await req.json();

    if ( !slug || !host || !password || !serial || !command) {
      return new Response(JSON.stringify({
        success: false,
        error: 'missing values for host, password, serial, or command'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = buildCommand(command, params);
    
    if (!payload || Object.keys(payload).length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `command ${command} does not exist.`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await sendCommand(slug, host, password, serial, payload);

    console.log('command result:', result.message || result.error);
    
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

async function sendCommand(slug: string, host: string, password: string, serial: string, payload: any) {
  try {
    await mqttManager.publish(host, password, serial, JSON.stringify(payload));

    return {
      success: true,
      message: 'successfully sent command',
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}