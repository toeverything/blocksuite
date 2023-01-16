import { Box } from '../components/Box';

export const Layout = ({ children }: React.PropsWithChildren) => (
  <Box
    css={{
      maxW: '100%',
    }}
  >
    {children}
  </Box>
);
