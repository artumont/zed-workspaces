use zed_extension_api as zed;

struct ZedWorkspace {
    
}

impl zed::Extension for ZedWorkspace {
    fn new() -> Self {
        Self {}
    }
}

zed::register_extension!(ZedWorkspace);
