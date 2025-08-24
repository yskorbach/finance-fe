import { render, screen } from '@testing-library/react';

function Hello() {
  return <div>hello finance-fe</div>;
}

test('renders text', () => {
  render(<Hello />);
  expect(screen.getByText(/hello finance-fe/i)).toBeInTheDocument();
});
