import { Share } from 'react-native';
import { crearCompartir } from './compartir';

describe('compartir', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('abre el cuadro de compartir con el texto', async () => {
    const espia = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction } as Awaited<ReturnType<typeof Share.share>>);

    await crearCompartir().compartir('Te invito a un círculo');

    expect(espia).toHaveBeenCalledWith({ message: 'Te invito a un círculo' });
  });

  it('si la persona manda el texto, lo dice', async () => {
    jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction } as Awaited<ReturnType<typeof Share.share>>);

    await expect(crearCompartir().compartir('hola')).resolves.toBe('compartido');
  });

  it('si la persona cierra el cuadro sin mandar nada, lo dice', async () => {
    jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction } as Awaited<ReturnType<typeof Share.share>>);

    await expect(crearCompartir().compartir('hola')).resolves.toBe('cancelado');
  });

  it('si no se pudo abrir el cuadro, lanza el error', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('sin cuadro de compartir'));

    await expect(crearCompartir().compartir('hola')).rejects.toThrow();
  });
});
