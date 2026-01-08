import { World } from '@iwsdk/core';
import { XRInputManager } from '@iwsdk/xr-input';

/**
 * IWSDK Bootstrap for WebXR Layers Start Template
 * Replaces manual WebXR setup with IWSDK's ECS architecture
 */
export class IWSDKBootstrap {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // IWSDK World instance
    this.world = null;
    this.inputManager = null;
    
    // System instances
    this.systems = new Map();
    
    console.log('IWSDK Bootstrap initialized');
  }

  async initialize() {
    try {
      console.log('Initializing IWSDK World...');
      
      // Create IWSDK World with Three.js integration
      this.world = new World({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
        enablePhysics: false, // Start simple
        enableAudio: true,
        enableLocomotion: false // We'll add this later
      });

      // Initialize XR Input Management
      console.log('Initializing XR Input Manager...');
      this.inputManager = new XRInputManager({
        world: this.world,
        scene: this.scene,
        camera: this.camera
      });

      if (this.inputManager.initialize) {
        await this.inputManager.initialize();
      }

      // Register core systems
      this.registerCoreSystems();

      // Start the world
      await this.world.start();
      
      console.log('IWSDK Bootstrap initialized successfully');
      
      // Expose for debugging
      if (typeof window !== 'undefined') {
        window.iwsdk = {
          world: this.world,
          inputManager: this.inputManager,
          systems: this.systems
        };
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize IWSDK Bootstrap:', error);
      this.dispose();
      throw error;
    }
  }

  registerCoreSystems() {
    // Input system setup
    this.setupInputSystem();
    
    // Video layer system (preserve existing functionality)
    this.setupVideoLayerSystem();
    
    console.log('Core IWSDK systems registered');
  }

  setupInputSystem() {
    // Controller events
    this.inputManager.on('controllerAdded', (controller) => {
      console.log(`Controller connected: ${controller.hand}`);
      this.emit('controllerConnected', controller);
    });

    this.inputManager.on('controllerRemoved', (controller) => {
      console.log(`Controller disconnected: ${controller.hand}`);
      this.emit('controllerDisconnected', controller);
    });

    // Button events
    this.inputManager.on('trigger', (event) => {
      this.emit('trigger', event);
    });

    this.inputManager.on('squeeze', (event) => {
      this.emit('squeeze', event);
    });

    this.inputManager.on('menu', (event) => {
      this.emit('menu', event);
    });
  }

  setupVideoLayerSystem() {
    // Create a custom system for video layer management
    const videoSystem = {
      name: 'VideoLayerSystem',
      update: (deltaTime) => {
        // Video layer updates will be handled here
      }
    };
    
    this.systems.set('video', videoSystem);
  }

  // Event system for communication with existing code
  on(eventName, callback) {
    if (!this._eventListeners) this._eventListeners = {};
    if (!this._eventListeners[eventName]) this._eventListeners[eventName] = [];
    this._eventListeners[eventName].push(callback);
  }

  emit(eventName, data) {
    if (this._eventListeners && this._eventListeners[eventName]) {
      this._eventListeners[eventName].forEach(callback => callback(data));
    }
  }

  update(deltaTime) {
    if (this.world) {
      this.world.update(deltaTime);
    }
    
    if (this.inputManager) {
      this.inputManager.update(deltaTime);
    }
    
    // Update custom systems
    this.systems.forEach(system => {
      if (system.update) {
        system.update(deltaTime);
      }
    });
  }

  // Enhanced controller access
  getControllers() {
    if (this.inputManager) {
      return this.inputManager.getControllers();
    }
    return {};
  }

  // Session management integration
  onSessionStarted(session) {
    console.log('XR Session started, integrating with IWSDK');
    if (this.inputManager) {
      this.inputManager.onSessionStarted(session);
    }
  }

  onSessionEnded() {
    console.log('XR Session ended');
    if (this.inputManager) {
      this.inputManager.onSessionEnded();
    }
  }

  dispose() {
    console.log('Disposing IWSDK Bootstrap');
    
    // Dispose systems
    this.systems.forEach(system => {
      if (system.dispose) {
        system.dispose();
      }
    });
    this.systems.clear();
    
    // Dispose IWSDK components
    if (this.inputManager) {
      this.inputManager.dispose();
    }
    
    if (this.world) {
      this.world.dispose();
    }
    
    // Clear event listeners
    this._eventListeners = {};
  }
}

export default IWSDKBootstrap;
