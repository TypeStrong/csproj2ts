declare namespace csproj2ts {
    const DEFAULT_TYPESCRIPT_VERSION = "1.6.2";
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
        ActivePlatform?: string;
    }
    interface VSProjectDetails extends VSProjectParams {
        DefaultProjectConfiguration?: string;
        DefaultProjectPlatform?: string;
        DefaultVisualStudioVersion?: string;
        TypeScriptDefaultPropsFilePath?: string;
        TypeScriptDefaultConfiguration?: TypeScriptConfiguration;
    }
    interface TypeScriptConfiguration {
        AdditionalFlags?: string;
        AllowSyntheticDefaultImports?: boolean;
        AllowUnreachableCode?: boolean;
        AllowUnusedLabels?: boolean;
        BaseUrl?: string;
        Charset?: string;
        CodePage?: string;
        CompileBlocked?: boolean;
        CompileOnSaveEnabled?: boolean;
        DeclarationDir?: string;
        EmitBOM?: boolean;
        EmitDecoratorMetadata?: boolean;
        ExperimentalAsyncFunctions?: boolean;
        ExperimentalDecorators?: boolean;
        ForceConsistentCasingInFileNames?: boolean;
        GeneratesDeclarations?: boolean;
        InlineSourceMap?: boolean;
        InlineSources?: boolean;
        IsolatedModules?: boolean;
        JSXEmit?: string;
        MapRoot?: string;
        ModuleKind?: string;
        ModuleResolution?: string;
        NewLine?: string;
        NoEmitHelpers?: boolean;
        NoEmitOnError?: boolean;
        NoFallthroughCasesInSwitch?: boolean;
        NoImplicitAny?: boolean;
        NoImplicitReturns?: boolean;
        NoImplicitThis?: boolean;
        NoImplicitUseStrict?: boolean;
        NoUnusedLocals?: boolean;
        NoUnusedParameters?: boolean;
        NoLib?: boolean;
        NoResolve?: boolean;
        OutFile?: string;
        OutDir?: string;
        PreserveConstEnums?: boolean;
        PreferredUILang?: string;
        ReactNamespace?: string;
        RemoveComments?: boolean;
        RootDir?: boolean;
        SkipLibCheck?: boolean;
        SkipDefaultLibCheck?: boolean;
        SourceMap?: boolean;
        SourceRoot?: string;
        StrictNullChecks?: boolean;
        SuppressExcessPropertyErrors?: boolean;
        SuppressImplicitAnyIndexErrors?: boolean;
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
