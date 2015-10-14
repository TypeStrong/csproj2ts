declare module csproj2ts {
    const DEFAULT_TYPESCRIPT_VERSION: string;
    interface TypeScriptSettings extends TypeScriptConfiguration {
        VSProjectDetails?: VSProjectDetails;
        files?: string[];
    }
    interface VSProjectParams {
        ProjectFileName?: string;
        MSBuildExtensionsPath32?: string;
        VisualStudioVersion?: string;
        TypeScriptVersion?: string;
        ActiveConfiguration?: string;
    }
    interface VSProjectDetails extends VSProjectParams {
        DefaultProjectConfiguration?: string;
        DefaultVisualStudioVersion?: string;
        TypeScriptDefaultPropsFilePath?: string;
        TypeScriptDefaultConfiguration?: TypeScriptConfiguration;
    }
    interface TypeScriptConfiguration {
        AdditionalFlags?: string;
        Charset?: string;
        CodePage?: string;
        CompileBlocked?: boolean;
        CompileOnSaveEnabled?: boolean;
        EmitBOM?: boolean;
        EmitDecoratorMetadata?: boolean;
        ExperimentalAsyncFunctions?: boolean;
        ExperimentalDecorators?: boolean;
        GeneratesDeclarations?: boolean;
        InlineSourceMap?: boolean;
        InlineSources?: boolean;
        IsolatedModules?: boolean;
        JSXEmit?: string;
        MapRoot?: string;
        ModuleKind?: string;
        ModuleResolution?: string;
        NewLine?: string;
        NoEmitOnError?: boolean;
        NoEmitHelpers?: boolean;
        NoImplicitAny?: boolean;
        NoLib?: boolean;
        NoResolve?: boolean;
        OutFile?: string;
        OutDir?: string;
        PreserveConstEnums?: boolean;
        PreferredUILang?: string;
        RemoveComments?: boolean;
        RootDir?: boolean;
        SourceMap?: boolean;
        SourceRoot?: string;
        SuppressImplicitAnyIndexErrors?: boolean;
        SuppressExcessPropertyErrors?: boolean;
        Target?: string;
    }
    const fixVersion: (version: string) => string;
    var xml2jsReadXMLFile: (fileName: string) => Promise<any>;
    var getTypeScriptSettings: (projectInfo: VSProjectParams) => Promise<TypeScriptSettings>;
    var normalizePath: (path: string, settings: TypeScriptSettings) => string;
    var getTypeScriptDefaultsFromPropsFileOrDefaults: (settings: TypeScriptSettings) => Promise<TypeScriptConfiguration>;
    var programFiles: () => string;
}
export = csproj2ts;
