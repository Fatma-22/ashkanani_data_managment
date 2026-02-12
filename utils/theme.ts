import { ThemeConfig } from 'antd';

export const ashkananiSportTheme: ThemeConfig = {
    token: {
        // Primary colors - Deep Navy and Gold
        colorPrimary: '#01153e', // Deep Navy
        colorSuccess: '#FFD700', // Using Gold for success states
        colorWarning: '#f59e0b',
        colorError: '#991b1b',
        colorInfo: '#01153e', // Deep Navy

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
        boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    },
    components: {
        Layout: {
            headerBg: '#01153e',
            siderBg: '#01153e',
            bodyBg: '#f8fafc',
        },
        Menu: {
            darkItemBg: '#01153e',
            darkItemSelectedBg: '#FFD700',
            darkItemSelectedColor: '#000000',
            darkItemHoverBg: 'rgba(255, 215, 0, 0.1)',
            itemMarginInline: 8,
        },
        Card: {
            headerBg: '#ffffff',
            boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        Button: {
            primaryShadow: '0 2px 0 rgba(1, 21, 62, 0.1)',
        },
        Table: {
            headerBg: '#f1f5f9',
            headerSplitColor: '#e2e8f0',
            rowHoverBg: '#f8fafc',
        },
        Badge: {
            dotSize: 8,
        },
    },
};

// Sports-themed color palette
export const sportsColors = {
    // Primary palette (Navy)
    primary: {
        50: '#f0f4f8',
        100: '#d1e0ec',
        200: '#a3c2d9',
        300: '#75a3c6',
        400: '#4785b3',
        500: '#01153e', // Main Navy
        600: '#152b3c',
        700: '#10212e',
        800: '#0b1720',
        900: '#060d12',
    },

    // Success/Green (Muted Emerald)
    success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#065f46', // Main Muted Emerald
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
    },

    // Market value emphasis (Premium Gold)
    gold: {
        50: '#fffbf0',
        100: '#fff4d1',
        200: '#ffe9a3',
        300: '#ffde75',
        400: '#ffd347',
        500: '#FFD700', // Main Gold
        600: '#ccac00',
        700: '#998100',
        800: '#665600',
        900: '#332b00',
    },

    // Status colors
    status: {
        active: '#065f46',
        pending: '#FFD700',
        expired: '#6b7280',
        negotiation: '#01153e',
        signed: '#065f46',
        freeAgent: '#01153e',
        transferListed: '#FFD700',
    },
};

// Gradients
export const gradients = {
    primary: 'linear-gradient(135deg, #01153e 0%, #060d12 100%)',
    success: 'linear-gradient(135deg, #15803d 0%, #065f46 100%)',
    gold: 'linear-gradient(135deg, #FFD700 0%, #c5a059 100%)',
    blue: 'linear-gradient(135deg, #2563eb 0%, #01153e 100%)',
    premium: 'linear-gradient(135deg, #01153e 0%, #FFD700 100%)',
};
