export type Theme = {
    name: string;
    colors: {
        bgPrimary?: string;
        bgSecondary?: string;
        text?: string;
        h1?: string;
        h2?: string;
        h3?: string;
        strong?: string;
        em?: string;
        link?: string;
        code?: string;
        codeBg?: string;
        blockquote?: string;
        hr?: string;
        syntaxMarker?: string;
        cursor?: string;
        selection?: string;
    }
}

export type Stats = {
    words: number;
    chars: number;
    lines: number;
    line: number;
    column: number;
}

export type Options = {
    fontSize?: string;
    lineHeight?: string;
    fontFamily?: string;
    padding?: string;
    theme?: string | Theme;
    colors?: Theme['colors'];
    mobile?: {
        fontSize?: string;
        padding?: string;
        lineHeight?: string;
    }
    autofocus?: boolean;
    placeholder?: string;
    value?: string;
    showStats?: boolean;
    statsFormatter?: (stats: Stats) => string;
    toolbar?: boolean;
    onChange?: (value: string, instance: Editor) => void;
    onKeydown?: (event: KeyboardEvent, instance: Editor) => void;
}

export type Editor = {
    blur: () => void;
    destroy: () => void;
    focus: () => void;
    getValue: () => string;
    isInitialized: () => boolean;
    reinit(options: Options): void;
    setTheme: (theme: string | Theme) => void;
    setValue: (value: string) => void;
    showStats: (show: boolean) => void;
}


type Target = string | HTMLElement | NodeList | HTMLElement[]

interface OverTypeModule {
    destroyAll: () => void;
    getInstance: (element: HTMLElement) => Editor | null;
    init: (target: Target, options?: Options) => Editor[];
    new(target: Target, options?: Options): Editor[];
    setTheme: (theme: string | Theme, overrides: Theme['colors']) => void;
    themes: {
        'solar': Theme;
        'cave': Theme;
    }
}
declare const OverType: OverTypeModule
export default OverType
