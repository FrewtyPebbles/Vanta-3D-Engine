import { GraphicsManager } from "../graphics_manager";
import { ShaderProgram } from "../shader_program";
import Engine from "../../engine";

export enum MEMORY_USAGE_MODE {
    STATIC_DRAW,
    DYNAMIC_DRAW,
    STREAM_DRAW,
    STATIC_READ,
    DYNAMIC_READ,
    STREAM_READ,
    STATIC_COPY,
    DYNAMIC_COPY,
    STREAM_COPY,
};

interface UBOMemberData {
    index:number
    offset:number
}

export class UniformBufferObject {
    shader_program:ShaderProgram
    graphics_manager:GraphicsManager
    name:string
    members:{[key:string]:UBOMemberData} = {}
    gl_buffer:WebGLBuffer
    gl_ubo_block_index: number
    gl_ubo_block_size: number
    memory_usage_mode:MEMORY_USAGE_MODE
    private gl_memory_usage_mode:number
    gl_ubo_index:number
    static ubo_counter:number = 0
    constructor(shader_program:ShaderProgram, name:string, members:string[], memory_usage_mode:MEMORY_USAGE_MODE = MEMORY_USAGE_MODE.DYNAMIC_DRAW) {
        this.shader_program = shader_program;
        this.graphics_manager = this.shader_program.gm;
        this.name = name;

        const gl = this.graphics_manager.gl;
        this.memory_usage_mode = memory_usage_mode;
        switch (this.memory_usage_mode) {
            case MEMORY_USAGE_MODE.DYNAMIC_DRAW:
                this.gl_memory_usage_mode = gl.DYNAMIC_DRAW;
                break;
            case MEMORY_USAGE_MODE.STATIC_DRAW:
                this.gl_memory_usage_mode = gl.STATIC_DRAW;
                break;
            case MEMORY_USAGE_MODE.STREAM_DRAW:
                this.gl_memory_usage_mode = gl.STREAM_DRAW;
                break;
            case MEMORY_USAGE_MODE.STATIC_READ:
                this.gl_memory_usage_mode = gl.STATIC_READ;
                break;
            case MEMORY_USAGE_MODE.DYNAMIC_READ:
                this.gl_memory_usage_mode = gl.DYNAMIC_READ;
                break;
            case MEMORY_USAGE_MODE.STREAM_READ:
                this.gl_memory_usage_mode = gl.STREAM_READ;
                break;
            case MEMORY_USAGE_MODE.STATIC_COPY:
                this.gl_memory_usage_mode = gl.STATIC_COPY;
                break;
            case MEMORY_USAGE_MODE.DYNAMIC_COPY:
                this.gl_memory_usage_mode = gl.DYNAMIC_COPY;
                break;
            case MEMORY_USAGE_MODE.STREAM_COPY:
                this.gl_memory_usage_mode = gl.STREAM_COPY;
                break;
        }

        // Create the gl buffer

        this.gl_ubo_block_index = gl.getUniformBlockIndex(this.shader_program, this.name);

        this.gl_ubo_block_size = gl.getActiveUniformBlockParameter(this.shader_program, this.gl_ubo_block_index, gl.UNIFORM_BLOCK_DATA_SIZE);

        this.gl_buffer = gl.createBuffer();

        gl.bindBuffer(gl.UNIFORM_BUFFER, this.gl_buffer);

        gl.bufferData(gl.UNIFORM_BUFFER, this.gl_ubo_block_size, this.gl_memory_usage_mode);
        
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        this.gl_ubo_index = UniformBufferObject.ubo_counter;
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.gl_ubo_index, this.gl_buffer);

        const member_indices = gl.getUniformIndices(this.shader_program.webgl_shader_program!, members);

        if (member_indices === null) {
            throw Error(`Failed to get member indices ${members} of UBO "${this.name}".`);
        }

        const member_offsets = gl.getActiveUniforms(this.shader_program.webgl_shader_program!, member_indices, gl.UNIFORM_OFFSET);

        members.forEach((name, index) => {
            this.members[name] = {
                index: member_indices[index],
                offset: member_offsets[index]
            }
        });

        let index = gl.getUniformBlockIndex(this.shader_program.webgl_shader_program!, this.name);
        gl.uniformBlockBinding(this.shader_program.webgl_shader_program!, index, this.gl_ubo_index);

        // increment the UBO counter
        UniformBufferObject.ubo_counter++;
    }

    bind() {
        const gl = this.graphics_manager.gl;
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.gl_buffer);
    }

    unbind() {
        const gl = this.graphics_manager.gl;
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    set_uniform(name:string, value:any, bind:boolean = false) {
        const gl = this.graphics_manager.gl;
        if (bind)
            gl.bindBuffer(gl.UNIFORM_BUFFER, this.gl_buffer);

        gl.bufferSubData(gl.UNIFORM_BUFFER, this.members[name].offset, value);

        if (bind)
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    cleanup() {
        const gl = this.graphics_manager.gl;
        gl.deleteBuffer(this.gl_buffer);
    }
}