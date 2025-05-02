from typing import Annotated

from fastapi import Depends

from .models import Session, get_session


SessionDep = Annotated[Session, Depends(get_session)]
