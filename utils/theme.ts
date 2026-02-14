import { ThemeConfig } from 'antd';

export const ashkananiSportTheme: ThemeConfig = {
    token: {
        // ASM Brand colors - Gold and Dark Teal
        colorPrimary: '#C9A24D', // Gold
        colorSuccess: '#C9A24D', // Using Gold for success/primary actions
        colorWarning: '#f59e0b',
        colorError: '#991b1b',
        colorInfo: '#C9A24D',

        // Text & Background
        colorText: '#3F3F3F', // Soft Black (rgb 63 63 63)
        colorTextDescription: '#8C8C8C', // Premium Gray
        colorBgContainer: '#ffffff',
        colorBgLayout: '#F2F2F2', // Off White

        // Border radius
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,

        // Typography
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 14,
        fontSizeHeading1: 32,
        fontSizeHeading2: 24,
        fontSizeHeading3: 20,
        fontSizeHeading4: 16,

        // Spacing
        marginLG: 24,
        marginMD: 16,
        marginSM: 12,
        marginXS: 8,

        // Box shadow
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        boxShadowSecondary: '0 6px 166px 0 rgba(0, 0, 0, 0.08), 0 3px 10px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    },
    components: {
        Layout: {
            headerBg: '#3F3F3F', // Soft Black
            siderBg: '#3F3F3F', // Soft Black
            bodyBg: '#F2F2F2', // Off White
        },
        Menu: {
            darkItemBg: '#3F3F3F',
            darkItemSelectedBg: '#C9A24D',
            darkItemSelectedColor: '#ffffff',
            darkItemHoverBg: 'rgba(201, 162, 77, 0.1)',
            itemMarginInline: 8,
        },
        Card: {
            headerBg: '#ffffff',
            boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        Button: {
            primaryShadow: '0 2px 0 rgba(201, 162, 77, 0.1)',
        },
        Table: {
            headerBg: '#F2F2F2',
            headerSplitColor: '#d4d4d4',
            rowHoverBg: '#ffffff',
        },
        Badge: {
            dotSize: 8,
        },
    },
};

// Sports-themed color palette
export const sportsColors = {
    // Primary palette (Dark Teal)
    primary: {
        50: '#F2F2F2',
        100: '#e6eaea',
        200: '#ccd5d6',
        300: '#99abaa',
        400: '#66807f',
        500: '#3F3F3F', // Soft Black
        600: '#3F3F3F',
        700: '#3F3F3F',
        800: '#3F3F3F',
        900: '#3F3F3F',
    },

    // Success/Green (Keeping for functional tags if needed, but primary is Gold)
    success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#065f46',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
    },

    // Brand Gold
    gold: {
        50: '#faf6eb',
        100: '#f5edd7',
        200: '#ebdbaf',
        300: '#e1c987',
        400: '#d7b75f',
        500: '#C9A24D', // Main Gold
        600: '#B68F3F',
        700: '#8c6e31',
        800: '#624d22',
        900: '#382c14',
    },

    // Status colors
    status: {
        active: '#C9A24D',
        pending: '#8C8C8C',
        expired: '#5E5E5E',
        negotiation: '#3F3F3F',
        signed: '#C9A24D',
        freeAgent: '#3F3F3F',
        transferListed: '#C9A24D',
    },
};

// Gradients
export const gradients = {
    primary: 'linear-gradient(135deg, #3F3F3F 0%, #3F3F3F 100%)',
    success: 'linear-gradient(135deg, #C9A24D 0%, #B68F3F 100%)',
    gold: 'linear-gradient(135deg, #C9A24D 0%, #B68F3F 100%)',
    blue: 'linear-gradient(135deg, #3F3F3F 0%, #3F3F3F 100%)',
    premium: 'linear-gradient(135deg, #3F3F3F 0%, #C9A24D 100%)',
};
